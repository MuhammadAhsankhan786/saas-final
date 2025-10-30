<?php

namespace App\Http\Controllers;

use App\Models\ConsentForm;
use Illuminate\Http\Request;
use App\Http\Controllers\DatabaseSeederController;
use Illuminate\Support\Facades\Log;

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
                // Provider only sees consent forms for their assigned clients
                $query->whereHas('client', function ($q) use ($user) {
                    $q->where('preferred_provider_id', $user->id);
                });
            }

            $consentForms = $query->get();

            // If no data and provider role, seed sample consent forms
            if ($consentForms->isEmpty() && $user->role === 'provider') {
                $seeded = DatabaseSeederController::seedMissingData();
                if (in_array('consent_forms', $seeded) || !ConsentForm::query()->exists()) {
                    Log::info('No consent forms found; data seeded automatically...');
                    $consentForms = $query->get();
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
            // Provider can only see consent forms for their assigned clients
            if ($consentForm->client->preferred_provider_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
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
}
