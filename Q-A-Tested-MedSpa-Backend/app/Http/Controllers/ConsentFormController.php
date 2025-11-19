<?php

namespace App\Http\Controllers;

use App\Models\ConsentForm;
use Illuminate\Http\Request;
use App\Http\Controllers\DatabaseSeederController;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf as PDF;

class ConsentFormController extends Controller
{
    /**
     * Display a listing of the consent forms.
     */
    public function index()
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $query = ConsentForm::query();

            if ($user->role === 'client') {
                $client = \App\Models\Client::where('user_id', $user->id)->first();
                if ($client) {
                    $query->where('client_id', $client->id);
                } else {
                    return response()->json([]);
                }
            } elseif ($user->role === 'provider') {
                // Provider only sees consent forms for clients who have appointments with them
                // Optimized: Use subquery instead of pluck + whereIn for better performance
                $query->whereHas('client', function ($q) use ($user) {
                    $q->whereHas('appointments', function ($q2) use ($user) {
                        $q2->where('provider_id', $user->id);
                    });
                });
            }

            $consentForms = $query->get();

            // If no data and provider role, seed sample consent forms (only once, not on every request)
            if ($consentForms->isEmpty() && $user->role === 'provider') {
                // Check if provider's clients have ANY consent forms to avoid repeated seeding
                $hasConsentForms = ConsentForm::whereHas('client', function ($q) use ($user) {
                    $q->whereHas('appointments', function ($q2) use ($user) {
                        $q2->where('provider_id', $user->id);
                    });
                })->exists();
                
                if (!$hasConsentForms) {
                    try {
                        // Force seed consent forms for provider's clients
                        $this->seedProviderConsentForms($user);
                        // Reload consent forms after seeding
                        $consentForms = $query->get();
                        Log::info('Consent forms seeded for provider', ['provider_id' => $user->id]);
                    } catch (\Exception $e) {
                        Log::error('Failed to seed consent forms', [
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                    }
                }
            }

            // Transform to safe JSON structure
            $result = $consentForms->map(function ($cf) {
                try {
                    $clientData = null;
                    if ($cf->client_id) {
                        try {
                            $client = $cf->client ?? \App\Models\Client::find($cf->client_id);
                            if ($client) {
                                $clientUser = null;
                                if ($client->user_id) {
                                    try {
                                        $user = $client->clientUser ?? \App\Models\User::find($client->user_id);
                                        if ($user) {
                                            $clientUser = [
                                                'id' => $user->id ?? null,
                                                'name' => $user->name ?? '',
                                                'email' => $user->email ?? '',
                                            ];
                                        }
                                    } catch (\Exception $e) {
                                        // Skip clientUser if failed
                                    }
                                }
                                $clientData = [
                                    'id' => $client->id ?? null,
                                    'name' => $client->name ?? '',
                                    'email' => $client->email ?? '',
                                    'clientUser' => $clientUser,
                                ];
                            }
                        } catch (\Exception $e) {
                            \Illuminate\Support\Facades\Log::warning('Failed to load client for consent form', [
                                'consent_form_id' => $cf->id,
                                'error' => $e->getMessage()
                            ]);
                        }
                    }

                    $serviceData = null;
                    if ($cf->service_id) {
                        try {
                            $service = $cf->service ?? \App\Models\Service::find($cf->service_id);
                            if ($service) {
                                $serviceData = [
                                    'id' => $service->id ?? null,
                                    'name' => $service->name ?? '',
                                    'price' => $service->price ?? 0,
                                ];
                            }
                        } catch (\Exception $e) {
                            // Skip service if failed
                        }
                    }

                    return [
                        'id' => $cf->id ?? null,
                        'client_id' => $cf->client_id ?? null,
                        'service_id' => $cf->service_id ?? null,
                        'client' => $clientData,
                        'service' => $serviceData,
                        'form_type' => $cf->form_type ?? '',
                        'digital_signature' => $cf->digital_signature ?? null,
                        'file_url' => $cf->file_url ?? null,
                        'date_signed' => $cf->date_signed ?? null,
                        'created_at' => $cf->created_at ?? null,
                        'updated_at' => $cf->updated_at ?? null,
                    ];
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed to transform consent form', [
                        'consent_form_id' => $cf->id ?? 'unknown',
                        'error' => $e->getMessage()
                    ]);
                    return null;
                }
            })->filter();

            return response()->json($result->values());
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('ConsentForm index failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([]);
        }
    }

    /**
     * Store a newly created consent form.
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        
        // Client can only create consent forms for themselves
        if ($user->role === 'client') {
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client) {
                return response()->json(['message' => 'Client profile not found'], 404);
            }
            // Force client_id to be the logged-in client's ID
            $request->merge(['client_id' => $client->id]);
        }
        
        // Provider can only create consent forms for clients who have appointments with them
        if ($user->role === 'provider') {
            $hasAppointment = \App\Models\Appointment::where('provider_id', $user->id)
                ->where('client_id', $request->client_id)
                ->exists();
            
            if (!$hasAppointment) {
                Log::warning('Provider attempted to create consent form for client without appointment', [
                    'provider_id' => $user->id,
                    'client_id' => $request->client_id,
                ]);
                return response()->json([
                    'message' => 'Unauthorized - You can only create consent forms for clients who have appointments with you'
                ], 403);
            }
        }
        
        $request->validate([
            'client_id'        => 'required|exists:clients,id',
            'service_id'       => 'required|exists:services,id',
            'form_type'        => 'required|in:consent,GFE,intake',
            'digital_signature'=> 'nullable|string',
            'file'             => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        // Store file securely in private storage
        $fileUrl = $request->hasFile('file') 
            ? $request->file('file')->store('consents', 'local') 
            : null;

        $consentForm = ConsentForm::create([
            'client_id'         => $request->client_id,
            'service_id'        => $request->service_id,
            'form_type'         => $request->form_type,
            'digital_signature' => $request->digital_signature,
            'file_url'          => $fileUrl,
            'date_signed'       => now(),
        ]);

        return response()->json([
            'message' => 'Consent form created successfully',
            'consent_form' => $consentForm->load(['client.clientUser','service'])
        ], 201);
    }

    /**
     * Display the specified consent form.
     */
    public function show(string $id)
    {
        $consentForm = ConsentForm::with(['client.clientUser','service'])->findOrFail($id);
        $user = auth()->user();

        if ($user->role === 'client') {
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client || $consentForm->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($user->role === 'provider') {
            // Provider can only see consent forms for clients who have appointments with them
            $hasAppointment = \App\Models\Appointment::where('provider_id', $user->id)
                ->where('client_id', $consentForm->client_id)
                ->exists();
            
            if (!$hasAppointment) {
                Log::warning('Provider attempted to view consent form for client without appointment', [
                    'provider_id' => $user->id,
                    'client_id' => $consentForm->client_id,
                ]);
                return response()->json([
                    'message' => 'Unauthorized - You can only view consent forms for clients who have appointments with you'
                ], 403);
            }
        }

        return response()->json($consentForm);
    }

    /**
     * Update the specified consent form.
     */
    public function update(Request $request, string $id)
    {
        $consentForm = ConsentForm::findOrFail($id);
        $user = auth()->user();

        // Client can only update their own consent forms
        if ($user->role === 'client') {
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client || $consentForm->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $request->validate([
            'form_type'        => 'nullable|in:consent,GFE,intake',
            'digital_signature'=> 'nullable|string',
            'file'             => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('file')) {
            $consentForm->file_url = $request->file('file')->store('consents', 'local');
        }

        $consentForm->update($request->only(['form_type','digital_signature']));

        return response()->json([
            'message' => 'Consent form updated successfully',
            'consent_form' => $consentForm->load(['client.clientUser','service'])
        ]);
    }

    /**
     * Remove the specified consent form.
     */
    public function destroy(string $id)
    {
        $consentForm = ConsentForm::findOrFail($id);
        $user = auth()->user();

        // Client can only delete their own consent forms
        if ($user->role === 'client') {
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client || $consentForm->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $consentForm->delete();

        return response()->json(['message' => 'Consent form deleted successfully']);
    }

    /**
     * Seed consent forms for provider's clients
     */
    private function seedProviderConsentForms($provider)
    {
        try {
            // Get provider's clients (those with appointments)
            $clients = \App\Models\Client::whereHas('appointments', function ($q) use ($provider) {
                $q->where('provider_id', $provider->id);
            })->get();

            if ($clients->isEmpty()) {
                Log::warning('No clients found for provider to seed consent forms', ['provider_id' => $provider->id]);
                return;
            }

            // Get available services
            $services = \App\Models\Service::limit(2)->get();
            if ($services->isEmpty()) {
                Log::warning('No services found to seed consent forms');
                return;
            }

            $formTypes = ['consent', 'gfe', 'intake'];
            $consentFormsCreated = [];

            // Create consent forms for each client-service combination
            foreach ($clients as $index => $client) {
                $service = $services[$index % $services->count()];
                $formType = $formTypes[$index % count($formTypes)];

                // Create signed consent form
                $consent1 = ConsentForm::firstOrCreate(
                    [
                        'client_id' => $client->id,
                        'service_id' => $service->id,
                        'form_type' => $formType,
                    ],
                    [
                        'digital_signature' => 'signed',
                        'date_signed' => now()->subDays(rand(1, 30)),
                    ]
                );
                $consentFormsCreated[] = $consent1->id;

                // Create pending consent form (different service if available)
                if ($services->count() > 1) {
                    $otherService = $services[($index + 1) % $services->count()];
                    $consent2 = ConsentForm::firstOrCreate(
                        [
                            'client_id' => $client->id,
                            'service_id' => $otherService->id,
                            'form_type' => 'consent',
                        ],
                        [
                            'digital_signature' => null,
                            'date_signed' => null,
                        ]
                    );
                    $consentFormsCreated[] = $consent2->id;
                }
            }

            Log::info('Seeded consent forms for provider', [
                'provider_id' => $provider->id,
                'consent_form_ids' => $consentFormsCreated,
                'count' => count($consentFormsCreated)
            ]);
        } catch (\Exception $e) {
            Log::error('Error seeding provider consent forms', [
                'provider_id' => $provider->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Download consent form as PDF
     */
    public function downloadPDF($id)
    {
        try {
            $user = auth()->user();
            $consentForm = ConsentForm::with(['client.clientUser', 'service'])->findOrFail($id);

            // RBAC: Provider can only download consent forms for their clients
            if ($user->role === 'provider') {
                $hasAppointment = \App\Models\Appointment::where('provider_id', $user->id)
                    ->where('client_id', $consentForm->client_id)
                    ->exists();
                
                if (!$hasAppointment) {
                    Log::warning('Provider attempted to download consent form for client without appointment', [
                        'provider_id' => $user->id,
                        'client_id' => $consentForm->client_id,
                    ]);
                    return response()->json([
                        'message' => 'Unauthorized - You can only download consent forms for clients who have appointments with you'
                    ], 403);
                }
            }

            // Prepare data for PDF
            $data = [
                'consentForm' => $consentForm,
                'client' => $consentForm->client,
                'service' => $consentForm->service,
                'status' => $consentForm->date_signed ? 'signed' : 'pending',
                'signedDate' => $consentForm->date_signed ? \Carbon\Carbon::parse($consentForm->date_signed)->format('F d, Y') : 'Not signed',
                'expiryDate' => $consentForm->date_signed ? \Carbon\Carbon::parse($consentForm->date_signed)->addYear()->format('F d, Y') : 'N/A',
            ];

            $pdf = PDF::loadView('consents.form-pdf', $data);
            
            $filename = 'consent-form-' . $consentForm->id . '-' . ($consentForm->client->name ?? 'client') . '.pdf';
            $filename = preg_replace('/[^a-z0-9\-_\.]/i', '-', $filename); // Sanitize filename
            
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('Consent form PDF download failed', [
                'consent_form_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to generate PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
