<?php

namespace App\Http\Controllers;

use App\Models\Treatment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\DatabaseSeederController;

class TreatmentController extends Controller
{
    /**
     * Display a listing of treatments.
     */
    public function index()
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $query = Treatment::query();

            // Client → only their own treatments
            if ($user->role === 'client') {
                $client = \App\Models\Client::where('user_id', $user->id)->first();
                if ($client) {
                    $query->whereHas('appointment', function ($q) use ($client) {
                        $q->where('client_id', $client->id);
                    });
                } else {
                    return response()->json([]);
                }
            } elseif ($user->role === 'provider') {
                // Provider only sees their own treatments
                $query->where('provider_id', $user->id);
            }

            $treatments = $query->get();

            // If no data and provider role, seed sample treatments
            if ($treatments->isEmpty() && $user->role === 'provider') {
                $seeded = DatabaseSeederController::seedMissingData();
                if (in_array('treatments', $seeded) || !Treatment::query()->exists()) {
                    \Illuminate\Support\Facades\Log::info('No treatments found; data seeded automatically...');
                    $treatments = $query->get();
                }
            }

            // Transform to safe JSON structure
            $result = $treatments->map(function ($treatment) {
                try {
                    $appointmentData = null;
                    if ($treatment->appointment_id) {
                        try {
                            $apt = $treatment->appointment ?? \App\Models\Appointment::find($treatment->appointment_id);
                            if ($apt) {
                                $clientData = null;
                                if ($apt->client_id) {
                                    $client = $apt->client ?? \App\Models\Client::find($apt->client_id);
                                    if ($client) {
                                        $clientData = [
                                            'id' => $client->id ?? null,
                                            'name' => $client->name ?? '',
                                            'email' => $client->email ?? '',
                                        ];
                                    }
                                }
                                $appointmentData = [
                                    'id' => $apt->id ?? null,
                                    'client' => $clientData,
                                    'start_time' => $apt->start_time ?? null,
                                ];
                            }
                        } catch (\Exception $e) {
                            \Illuminate\Support\Facades\Log::warning('Failed to load appointment for treatment', [
                                'treatment_id' => $treatment->id,
                                'error' => $e->getMessage()
                            ]);
                        }
                    }

                    return [
                        'id' => $treatment->id ?? null,
                        'appointment_id' => $treatment->appointment_id ?? null,
                        'provider_id' => $treatment->provider_id ?? null,
                        'appointment' => $appointmentData,
                        'treatment_type' => $treatment->treatment_type ?? '',
                        'cost' => $treatment->cost ?? 0,
                        'status' => $treatment->status ?? 'pending',
                        'description' => $treatment->description ?? null,
                        'notes' => $treatment->notes ?? null,
                        'treatment_date' => $treatment->treatment_date ?? null,
                        'created_at' => $treatment->created_at ?? null,
                        'updated_at' => $treatment->updated_at ?? null,
                    ];
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed to transform treatment', [
                        'treatment_id' => $treatment->id ?? 'unknown',
                        'error' => $e->getMessage()
                    ]);
                    return null;
                }
            })->filter();

            return response()->json($result->values(), 200);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Treatment index failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([], 200);
        }
    }

    /**
     * Seed sample treatments for provider when empty.
     */
    private function seedSampleTreatmentsIfEmpty($providerId): void
    {
        try {
            if (Treatment::query()->where('provider_id', $providerId)->exists()) {
                return; // Data already exists
            }

            // Get provider's appointments
            $appointments = \App\Models\Appointment::where('provider_id', $providerId)
                ->where('status', 'completed')
                ->limit(2)
                ->get();

            if ($appointments->isEmpty()) {
                \Illuminate\Support\Facades\Log::info('No completed appointments found for provider, skipping treatment seed');
                return;
            }

            foreach ($appointments as $appointment) {
                try {
                    Treatment::create([
                        'appointment_id' => $appointment->id,
                        'provider_id' => $providerId,
                        'treatment_type' => 'Facial Treatment',
                        'cost' => 150.00,
                        'status' => 'completed',
                        'description' => 'Sample treatment (auto-seeded)',
                        'treatment_date' => $appointment->start_time ?? now(),
                    ]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Failed to create sample treatment', [
                        'appointment_id' => $appointment->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            \Illuminate\Support\Facades\Log::info('Successfully seeded sample treatments for provider', [
                'provider_id' => $providerId,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to seed sample treatments', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Store a newly created treatment.
     */
    public function store(Request $request)
    {
        $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
            'provider_id'    => 'required|exists:users,id',
            'treatment_type' => 'required|string|max:255',
            'cost'           => 'required|numeric',
            'status'         => 'required|string|in:pending,completed,canceled',
            'description'    => 'nullable|string',
            'notes'          => 'nullable|string', // SOAP notes
            'before_photo'   => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            'after_photo'    => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            'treatment_date' => 'required|date',
        ]);

        // File uploads → Secure private storage
        $beforePhoto = $request->hasFile('before_photo')
            ? $request->file('before_photo')->store('treatments/before', 'local')
            : null;

        $afterPhoto = $request->hasFile('after_photo')
            ? $request->file('after_photo')->store('treatments/after', 'local')
            : null;

        $treatment = Treatment::create([
            'appointment_id' => $request->appointment_id,
            'provider_id'    => $request->provider_id,
            'treatment_type' => $request->treatment_type,
            'cost'           => $request->cost,
            'status'         => $request->status,
            'description'    => $request->description,
            'notes'          => $request->notes,
            'before_photo'   => $beforePhoto,
            'after_photo'    => $afterPhoto,
            'treatment_date' => $request->treatment_date,
        ]);

        return response()->json([
            'message'   => 'Treatment created successfully',
            'treatment' => $treatment->load(['appointment.client.clientUser', 'appointment.staff'])
        ], 201);
    }

    /**
     * Display the specified treatment.
     */
    public function show($id)
    {
        $treatment = Treatment::with(['appointment.client.clientUser', 'appointment.staff'])->findOrFail($id);
        $user = auth()->user();

        // Client can only see their own treatments
        if ($user->role === 'client' && $treatment->appointment->client_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Provider can only see their own treatments
        if ($user->role === 'provider' && $treatment->provider_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($treatment, 200);
    }

    /**
     * Update the specified treatment.
     */
    public function update(Request $request, $id)
    {
        $treatment = Treatment::findOrFail($id);
        $user = auth()->user();

        // Client can only update their own treatments
        if ($user->role === 'client' && $treatment->appointment->client_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Provider can only update their own treatments
        if ($user->role === 'provider' && $treatment->provider_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'treatment_type' => 'nullable|string|max:255',
            'cost'           => 'nullable|numeric',
            'status'         => 'nullable|string|in:pending,completed,canceled',
            'description'    => 'nullable|string',
            'notes'          => 'nullable|string', // SOAP notes
            'before_photo'   => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            'after_photo'    => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            'treatment_date' => 'nullable|date',
        ]);

        if ($request->hasFile('before_photo')) {
            $treatment->before_photo = $request->file('before_photo')->store('treatments/before', 'local');
        }

        if ($request->hasFile('after_photo')) {
            $treatment->after_photo = $request->file('after_photo')->store('treatments/after', 'local');
        }

        $treatment->update($request->only([
            'treatment_type', 'cost', 'status', 'description', 'notes', 'treatment_date'
        ]));

        return response()->json([
            'message'   => 'Treatment updated successfully',
            'treatment' => $treatment->load(['appointment.client.clientUser', 'appointment.staff'])
        ], 200);
    }

    /**
     * Remove the specified treatment.
     */
    public function destroy($id)
    {
        $treatment = Treatment::findOrFail($id);
        $user = auth()->user();

        // Client can only delete their own treatments
        if ($user->role === 'client' && $treatment->appointment->client_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Provider can only delete their own treatments
        if ($user->role === 'provider' && $treatment->provider_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $treatment->delete();

        return response()->json(['message' => 'Treatment deleted successfully'], 200);
    }
}
