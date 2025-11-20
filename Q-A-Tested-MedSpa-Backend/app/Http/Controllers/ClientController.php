<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\User;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Http\Controllers\DatabaseSeederController;

class ClientController extends Controller
{
    /**
     * Display a listing of clients.
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }
            
            // Start with basic query - don't eager load relationships initially to avoid errors
            $query = Client::query();

            // Provider filtering: See clients who are either:
            // 1. Assigned to them (preferred_provider_id) OR
            // 2. Have appointments with them
            // Security: Never return all clients if filtering fails - always use safe fallback
            if ($user->role === 'provider') {
                // Check if preferred_provider_id column exists
                $hasPreferredProviderColumn = Schema::hasColumn('clients', 'preferred_provider_id');
                
                if ($hasPreferredProviderColumn) {
                    // Filter by preferred_provider_id OR appointments relationship
                    $query->where(function ($q) use ($user) {
                        // Clients assigned to this provider
                        $q->where('preferred_provider_id', $user->id)
                          // OR clients who have appointments with this provider
                          ->orWhereHas('appointments', function ($appointmentQuery) use ($user) {
                              $appointmentQuery->where('provider_id', $user->id);
                          });
                    });
                } else {
                    // Safe fallback: Only filter by appointments if column doesn't exist
                    // This prevents security issue of returning all clients
                    Log::warning('preferred_provider_id column not found, using appointments-only filter for provider', [
                        'provider_id' => $user->id,
                    ]);
                    $query->whereHas('appointments', function ($q) use ($user) {
                        $q->where('provider_id', $user->id);
                    });
                }
            }

            // Apply filters
            if ($request->has('location_id')) {
                $query->where('location_id', $request->location_id);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            // Get clients and safely load relationships
            try {
                $clients = $query->get();
            } catch (\Exception $e) {
                Log::error('Error executing client query: ' . $e->getMessage(), [
                    'trace' => $e->getTraceAsString(),
                    'user_id' => $user->id,
                    'user_role' => $user->role,
                ]);
                // Return empty array on error
                return response()->json([]);
            }
            
            // If no data, check and seed all missing tables, then reload
            if ($clients->isEmpty()) {
                $seeded = DatabaseSeederController::seedMissingData();
                if (in_array('clients', $seeded) || !Client::query()->exists()) {
                    Log::info('No clients found; data seeded automatically...');
                    $clients = $query->get();
                }
            }
            
            // Manually build response array to avoid serialization issues
            $result = [];
            foreach ($clients as $client) {
                try {
                    $location = null;
                    if ($client->location_id) {
                        try {
                            $loc = $client->location;
                            if ($loc) {
                                $location = ['id' => $loc->id, 'name' => $loc->name];
                            }
                        } catch (\Exception $e) {
                            // Location relationship failed, skip it
                        }
                    }
                    
                    $clientUser = null;
                    if ($client->user_id) {
                        try {
                            $user = $client->clientUser;
                            if ($user) {
                                $clientUser = ['id' => $user->id, 'name' => $user->name, 'email' => $user->email];
                            }
                        } catch (\Exception $e) {
                            // User relationship failed, skip it
                        }
                    }
                    
                    $result[] = [
                        'id' => $client->id,
                        'name' => $client->name ?? '',
                        'email' => $client->email ?? '',
                        'phone' => $client->phone ?? '',
                        'location_id' => $client->location_id,
                        'user_id' => $client->user_id,
                        'status' => $client->status ?? 'active',
                        'created_at' => $client->created_at ? $client->created_at->toDateTimeString() : null,
                        'updated_at' => $client->updated_at ? $client->updated_at->toDateTimeString() : null,
                        'location' => $location,
                        'clientUser' => $clientUser,
                    ];
                } catch (\Exception $e) {
                    // If individual client processing fails, log and continue
                    Log::warning('Failed to process client ' . ($client->id ?? 'unknown') . ': ' . $e->getMessage());
                    // Still include basic client data even if relationships fail
                    $result[] = [
                        'id' => $client->id ?? null,
                        'name' => $client->name ?? '',
                        'email' => $client->email ?? '',
                        'phone' => $client->phone ?? '',
                        'location_id' => $client->location_id ?? null,
                        'user_id' => $client->user_id ?? null,
                        'status' => 'active',
                        'created_at' => $client->created_at ? $client->created_at->toDateTimeString() : null,
                        'updated_at' => $client->updated_at ? $client->updated_at->toDateTimeString() : null,
                        'location' => null,
                        'clientUser' => null,
                    ];
                }
            }
            
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('ClientController@index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id(),
                'user_role' => auth()->user()?->role,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'message' => 'Error fetching clients: ' . $e->getMessage(),
                'error' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Store a newly created client.
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        
        // Only admin and reception can create clients
        if (!$user || !in_array($user->role, ['admin', 'reception'])) {
            return response()->json(['message' => 'Unauthorized - Only admins and reception can create clients'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:clients,email',
            'phone' => 'required|string|max:20',
            'location_id' => 'required|exists:locations,id',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|in:male,female,other',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'zip_code' => 'nullable|string|max:20',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'medical_history' => 'nullable|string',
            'allergies' => 'nullable|string',
            'medications' => 'nullable|string',
            'skin_type' => 'nullable|string',
            'concerns' => 'nullable|string',
            'preferred_provider_id' => 'nullable|exists:users,id',
            'preferred_location_id' => 'nullable|exists:locations,id',
            'marketing_consent' => 'nullable|boolean',
            'sms_consent' => 'nullable|boolean',
            'email_consent' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $clientData = $request->all();
        
        // If no user_id is provided, set it to null (for admin-created clients)
        if (!isset($clientData['user_id'])) {
            $clientData['user_id'] = null;
        }
        
        $client = Client::create($clientData);

        return response()->json($client->load(['clientUser', 'location']), 201);
    }

    /**
     * Display the specified client.
     */
    public function show($id)
    {
        $user = auth()->user();
        $client = Client::with(['clientUser', 'location', 'appointments.provider'])
                        ->findOrFail($id);
        
        // Provider can only view clients who are either:
        // 1. Assigned to them (preferred_provider_id) OR
        // 2. Have appointments with them
        if ($user && $user->role === 'provider') {
            $hasAccess = false;
            
            // Check if preferred_provider_id column exists and client is assigned
            if (Schema::hasColumn('clients', 'preferred_provider_id')) {
                if ($client->preferred_provider_id === $user->id) {
                    $hasAccess = true;
                }
            }
            
            // Also check if client has appointments with this provider
            if (!$hasAccess) {
                $hasAppointment = \App\Models\Appointment::where('provider_id', $user->id)
                    ->where('client_id', $client->id)
                    ->exists();
                $hasAccess = $hasAppointment;
            }
            
            if (!$hasAccess) {
                Log::warning('Provider attempted to view client without relationship', [
                    'provider_id' => $user->id,
                    'client_id' => $client->id,
                    'preferred_provider_id' => $client->preferred_provider_id ?? 'N/A',
                ]);
                return response()->json([
                    'message' => 'Unauthorized - You can only view clients assigned to you or who have appointments with you'
                ], 403);
            }
        }
        
        return response()->json($client);
    }

    /**
     * Update the specified client.
     */
    public function update(Request $request, $id)
    {
        $client = Client::findOrFail($id);
        $user = auth()->user();
        
        // Only admin and reception can update clients
        if (!$user || !in_array($user->role, ['admin', 'reception'])) {
            return response()->json(['message' => 'Unauthorized - Only admins and reception can update clients'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:clients,email,' . $id,
            'phone' => 'sometimes|string|max:20',
            'location_id' => 'sometimes|exists:locations,id',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|in:male,female,other',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'zip_code' => 'nullable|string|max:20',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'medical_history' => 'nullable|string',
            'allergies' => 'nullable|string',
            'medications' => 'nullable|string',
            'skin_type' => 'nullable|string',
            'concerns' => 'nullable|string',
            'preferred_provider_id' => 'nullable|exists:users,id',
            'preferred_location_id' => 'nullable|exists:locations,id',
            'marketing_consent' => 'nullable|boolean',
            'sms_consent' => 'nullable|boolean',
            'email_consent' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $client->update($request->all());

        return response()->json($client->load(['clientUser', 'location']));
    }

    /**
     * Remove the specified client.
     */
    public function destroy($id)
    {
        $user = auth()->user();
        
        // Only admin and reception can delete clients
        if (!$user || !in_array($user->role, ['admin', 'reception'])) {
            return response()->json(['message' => 'Unauthorized - Only admins and reception can delete clients'], 403);
        }
        
        $client = Client::findOrFail($id);
        $client->delete();

        return response()->json(['message' => 'Client deleted successfully']);
    }
}
