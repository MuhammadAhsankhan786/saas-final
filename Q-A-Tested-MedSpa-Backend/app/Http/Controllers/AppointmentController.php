<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\User;
use App\Models\Location;
use App\Models\Service;
use App\Http\Controllers\DatabaseSeederController;
use App\Notifications\AppointmentCreated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class AppointmentController extends Controller
{
    /**
     * Get form data for booking appointments (providers, services, locations, packages)
     */
    public function formData(Request $request)
    {
        $user = Auth::user();
        
        $data = [
            'locations' => \App\Models\Location::select('id', 'name')->get(),
            'providers' => \App\Models\User::where('role', 'provider')->select('id', 'name', 'email')->get(),
            'services' => \App\Models\Service::select('id', 'name', 'price', 'duration')->get(),
            'packages' => \App\Models\Package::select('id', 'name', 'price', 'duration')->get(),
        ];
        
        // For client role, include their own client record
        if ($user && $user->role === 'client') {
            $client = Client::where('user_id', $user->id)->first();
            if ($client) {
                $data['client'] = [
                    'id' => $client->id,
                    'name' => $client->name,
                    'email' => $client->email,
                ];
            }
        }
        
        return response()->json($data);
    }

    /**
     * Display a listing of appointments with filters.
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }
            
            Log::info('Appointment index called', [
                'user_id' => $user->id,
                'user_role' => $user->role,
                'user_email' => $user->email,
            ]);
            
            // Use optional eager loading to prevent crashes if relationships don't exist
            $query = Appointment::query();

            // Apply role-based filtering
            if ($user->role === 'client') {
                $client = Client::where('user_id', $user->id)->first();
                if ($client) {
                    $query->where('client_id', $client->id);
                } else {
                    return response()->json(['message' => 'Client profile not found'], 404);
                }
            } elseif ($user->role === 'provider') {
                // Provider only sees their own appointments
                $query->where('provider_id', $user->id);
                Log::info('Applied provider filter', ['provider_id' => $user->id]);
            }

            // Apply filters
            if ($request->has('client_id')) {
                $query->where('client_id', $request->client_id);
            }

            if ($request->has('provider_id')) {
                $query->where('provider_id', $request->provider_id);
            }

            if ($request->has('location_id')) {
                $query->where('location_id', $request->location_id);
            }

            // Safe date filters – avoid exceptions on invalid formats
            try {
                if ($request->has('date')) {
                    $date = \Carbon\Carbon::createFromFormat('Y-m-d', (string) $request->date);
                    if ($date !== false) {
                        $query->whereDate('start_time', $date->toDateString());
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Invalid date filter provided to appointments index', [
                    'param' => 'date',
                    'value' => $request->date,
                    'error' => $e->getMessage(),
                ]);
            }

            try {
                if ($request->has('date_from')) {
                    $from = \Carbon\Carbon::createFromFormat('Y-m-d', (string) $request->date_from);
                    if ($from !== false) {
                        $query->whereDate('start_time', '>=', $from->toDateString());
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Invalid date_from filter provided to appointments index', [
                    'param' => 'date_from',
                    'value' => $request->date_from,
                    'error' => $e->getMessage(),
                ]);
            }

            try {
                if ($request->has('date_to')) {
                    $to = \Carbon\Carbon::createFromFormat('Y-m-d', (string) $request->date_to);
                    if ($to !== false) {
                        $query->whereDate('start_time', '<=', $to->toDateString());
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Invalid date_to filter provided to appointments index', [
                    'param' => 'date_to',
                    'value' => $request->date_to,
                    'error' => $e->getMessage(),
                ]);
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

        // Fetch and transform to a safe, consistent JSON shape to avoid serialization issues
        try {
            // Try to get appointments - handle potential database errors
            try {
                // Check if start_time column exists before ordering
                $columns = \Illuminate\Support\Facades\Schema::getColumnListing('appointments');
                if (in_array('start_time', $columns)) {
                    $appointments = $query->orderBy('start_time', 'desc')->get();
                } else {
                    // Fallback: use appointment_time or id for ordering
                    if (in_array('appointment_time', $columns)) {
                        $appointments = $query->orderBy('appointment_time', 'desc')->get();
                    } else {
                        $appointments = $query->orderBy('id', 'desc')->get();
                    }
                }
            } catch (\Exception $queryError) {
                Log::error('Database query failed', [
                    'error' => $queryError->getMessage(),
                    'trace' => $queryError->getTraceAsString(),
                    'provider_id' => $user->id ?? null,
                ]);
                // Try without ordering as fallback
                try {
                    $appointments = $query->get();
                } catch (\Exception $e2) {
                    Log::error('Fallback query also failed', [
                        'error' => $e2->getMessage(),
                    ]);
                    return response()->json([
                        'error' => 'Database query failed',
                        'message' => $queryError->getMessage(),
                        'data' => []
                    ], 500);
                }
            }

            // If no data, check and seed all missing tables, then reload
            if ($appointments->isEmpty()) {
                try {
                    // First, ensure base data exists (location, services, clients)
                    $seeded = DatabaseSeederController::seedMissingData();
                    Log::info('Auto-seeding base data completed', ['seeded' => $seeded]);
                } catch (\Exception $e) {
                    Log::error('Failed to seed base data', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
                
                try {
                    // Then, seed provider-specific appointments
                    Log::info('No appointments found for provider; seeding provider-specific appointments (auto)...', [
                        'provider_id' => $user->id,
                        'provider_email' => $user->email,
                    ]);
                    $this->seedSampleAppointmentsIfEmpty();
                } catch (\Exception $e) {
                    Log::error('Failed to seed provider appointments', [
                        'provider_id' => $user->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
                
                // Reload appointments for this provider
                try {
                    $appointments = $query->orderBy('start_time', 'desc')->get();
                    
                    Log::info('Provider appointments after seeding', [
                        'provider_id' => $user->id,
                        'count' => $appointments->count(),
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to reload appointments after seeding', [
                        'provider_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                    $appointments = collect([]); // Return empty collection if reload fails
                }
            }
            $result = $appointments->map(function ($apt) {
                try {
                    // Safely load relationships with try-catch
                    $clientData = null;
                    try {
                        if ($apt->client_id) {
                            $client = $apt->client ?? Client::find($apt->client_id);
                            if ($client) {
                                $clientData = [
                                    'id' => $client->id ?? null,
                                    'name' => $client->name ?? '',
                                    'email' => $client->email ?? '',
                                    'phone' => $client->phone ?? '',
                                ];
                            }
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to load client for appointment', ['appointment_id' => $apt->id, 'error' => $e->getMessage()]);
                    }

                    $providerData = null;
                    try {
                        if ($apt->provider_id) {
                            $provider = $apt->provider ?? User::find($apt->provider_id);
                            if ($provider) {
                                $providerData = [
                                    'id' => $provider->id ?? null,
                                    'name' => $provider->name ?? '',
                                    'email' => $provider->email ?? null,
                                ];
                            }
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to load provider for appointment', ['appointment_id' => $apt->id, 'error' => $e->getMessage()]);
                    }

                    $locationData = null;
                    try {
                        if ($apt->location_id) {
                            $location = $apt->location ?? Location::find($apt->location_id);
                            if ($location) {
                                $locationData = [
                                    'id' => $location->id ?? null,
                                    'name' => $location->name ?? '',
                                ];
                            }
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to load location for appointment', ['appointment_id' => $apt->id, 'error' => $e->getMessage()]);
                    }

                    $serviceData = null;
                    try {
                        if ($apt->service_id) {
                            $service = $apt->service ?? Service::find($apt->service_id);
                            if ($service) {
                                $serviceData = [
                                    'id' => $service->id ?? null,
                                    'name' => $service->name ?? '',
                                    'price' => $service->price ?? 0,
                                    'duration' => $service->duration ?? null,
                                ];
                            }
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to load service for appointment', ['appointment_id' => $apt->id, 'error' => $e->getMessage()]);
                    }

                    $packageData = null;
                    try {
                        if ($apt->package_id) {
                            $package = $apt->package ?? \App\Models\Package::find($apt->package_id);
                            if ($package) {
                                $packageData = [
                                    'id' => $package->id ?? null,
                                    'name' => $package->name ?? '',
                                    'price' => $package->price ?? null,
                                ];
                            }
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to load package for appointment', ['appointment_id' => $apt->id, 'error' => $e->getMessage()]);
                    }

                    return [
                        'id' => $apt->id ?? null,
                        'client_id' => $apt->client_id ?? null,
                        'provider_id' => $apt->provider_id ?? null,
                        'location_id' => $apt->location_id ?? null,
                        'service_id' => $apt->service_id ?? null,
                        'package_id' => $apt->package_id ?? null,
                        'client' => $clientData,
                        'provider' => $providerData,
                        'location' => $locationData,
                        'service' => $serviceData,
                        'package' => $packageData,
                        'start_time' => $apt->start_time ?? null,
                        'end_time' => $apt->end_time ?? null,
                        'status' => $apt->status ?? 'booked',
                        'notes' => $apt->notes ?? null,
                        'created_at' => $apt->created_at ?? null,
                        'updated_at' => $apt->updated_at ?? null,
                    ];
                } catch (\Exception $e) {
                    Log::error('Failed to transform appointment', [
                        'appointment_id' => $apt->id ?? 'unknown',
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    // Return minimal safe structure
                    return [
                        'id' => $apt->id ?? null,
                        'client_id' => $apt->client_id ?? null,
                        'provider_id' => $apt->provider_id ?? null,
                        'location_id' => $apt->location_id ?? null,
                        'service_id' => $apt->service_id ?? null,
                        'package_id' => $apt->package_id ?? null,
                        'client' => null,
                        'provider' => null,
                        'location' => null,
                        'service' => null,
                        'package' => null,
                        'start_time' => $apt->start_time ?? null,
                        'end_time' => $apt->end_time ?? null,
                        'status' => $apt->status ?? 'booked',
                        'notes' => $apt->notes ?? null,
                        'created_at' => $apt->created_at ?? null,
                        'updated_at' => $apt->updated_at ?? null,
                    ];
                }
            })->filter(); // Remove any null entries

            return response()->json($result->values());
        } catch (\Exception $e) {
            Log::error('Appointment index transformation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'provider_id' => $user->id ?? null,
            ]);
            // Fail-open: never crash UI; return empty list with error message for debugging
            return response()->json([
                'error' => 'Failed to load appointments',
                'message' => $e->getMessage(),
                'data' => []
            ], 200);
        }
        } catch (\Exception $outerException) {
            Log::error('Appointment index outer catch', [
                'error' => $outerException->getMessage(),
                'trace' => $outerException->getTraceAsString(),
                'provider_id' => $user->id ?? null,
            ]);
            return response()->json([
                'error' => 'Failed to load appointments',
                'message' => $outerException->getMessage(),
                'data' => []
            ], 200);
        }
    }

    /**
     * Seed a few sample appointments when the table is empty (auto-seed).
     * For provider role: ensures appointments are linked to the logged-in provider.
     */
    private function seedSampleAppointmentsIfEmpty(): void
    {
        try {
            $currentUser = Auth::user();
            
            // For provider role: check if THIS provider already has appointments
            if ($currentUser && $currentUser->role === 'provider') {
                if (Appointment::where('provider_id', $currentUser->id)->exists()) {
                    return; // Provider already has appointments
                }
            } else {
                // For other roles: check if any appointments exist
                if (Appointment::query()->exists()) {
                    return; // Data already exists
                }
            }

            // Ensure we have all required data - create if missing
            $client = Client::query()->first();
            if (!$client) {
                $user = User::where('role', 'client')->first();
                if (!$user) {
                    $user = User::create([
                        'name' => 'Demo Client',
                        'email' => 'client@demo.com',
                        'password' => bcrypt('demo123'),
                        'role' => 'client',
                    ]);
                }
                $location = Location::query()->first();
                if (!$location) {
                    $location = Location::create([
                        'name' => 'Main Branch',
                        'address' => '123 Main St',
                        'city' => 'City',
                        'state' => 'ST',
                        'zip' => '12345',
                        'timezone' => 'UTC',
                    ]);
                }
                $client = Client::create([
                    'user_id' => $user->id,
                    'name' => 'Demo Client',
                    'email' => 'client@demo.com',
                    'phone' => '555-0100',
                    'location_id' => $location->id,
                    'status' => 'active',
                ]);
            }

            $location = Location::query()->first();
            if (!$location) {
                $location = Location::create([
                    'name' => 'Main Branch',
                    'address' => '123 Main St',
                    'city' => 'City',
                    'state' => 'ST',
                    'zip' => '12345',
                    'timezone' => 'UTC',
                ]);
            }

            $service = Service::query()->first();
            if (!$service) {
                $service = Service::create([
                    'name' => 'Facial Treatment',
                    'price' => 150.00,
                    'duration' => 60,
                    'description' => 'Basic facial',
                ]);
            }

            // Use current logged-in provider or find/create one
            $currentUser = Auth::user();
            $targetProvider = null;
            
            if ($currentUser && $currentUser->role === 'provider') {
                $targetProvider = $currentUser;
            } else {
                $targetProvider = User::where('role', 'provider')->first();
                if (!$targetProvider) {
                    $targetProvider = User::create([
                        'name' => 'Demo Provider',
                        'email' => 'provider@medispa.com',
                        'password' => bcrypt('demo123'),
                        'role' => 'provider',
                    ]);
                }
            }

            if (!$client || !$location || !$targetProvider) {
                Log::warning('Skip seeding appointments: missing required data', [
                    'has_client' => !!$client,
                    'has_location' => !!$location,
                    'has_provider' => !!$targetProvider,
                ]);
                return;
            }

            // Link client to provider if provider role
            if ($currentUser && $currentUser->role === 'provider' && $client->preferred_provider_id !== $targetProvider->id) {
                $client->update(['preferred_provider_id' => $targetProvider->id]);
                Log::info('Linked client to provider', ['client_id' => $client->id, 'provider_id' => $targetProvider->id]);
            }

            // Ensure we have 2 clients for variety
            $client2 = Client::query()->skip(1)->first();
            if (!$client2) {
                // Create second client if needed
                $clientUser2 = \App\Models\User::updateOrCreate(
                    ['email' => 'client2@demo.com'],
                    [
                        'name' => 'Bob Smith',
                        'password' => bcrypt('demo123'),
                        'role' => 'client',
                    ]
                );
                $client2 = Client::updateOrCreate(
                    ['email' => 'client2@demo.com'],
                    [
                        'user_id' => $clientUser2->id,
                        'name' => 'Bob Smith',
                        'phone' => '555-0102',
                        'location_id' => $location->id,
                        'preferred_provider_id' => $targetProvider->id,
                        'status' => 'active',
                    ]
                );
            }
            
            // Ensure we have 2 services for variety
            $service2 = Service::query()->skip(1)->first();
            if (!$service2) {
                $service2 = Service::create([
                    'name' => 'Massage Therapy',
                    'price' => 200.00,
                    'duration' => 90,
                    'description' => 'Full body massage therapy',
                ]);
            }
            
            // Create 3 appointments for today with all required fields
            $today = now()->startOfDay();
            $createdAppointments = [];
            $hours = [9, 11, 14];
            
            foreach ($hours as $index => $hour) {
                $apptClient = ($index % 2 == 0) ? $client : $client2;
                $apptService = ($index == 0) ? $service : $service2;
                $start = $today->copy()->addHours($hour);
                $end = $start->copy()->addMinutes($apptService->duration ?? 60);
                
                try {
                    $appointment = Appointment::firstOrCreate(
                        [
                            'provider_id' => $targetProvider->id,
                            'client_id' => $apptClient->id,
                            'start_time' => $start,
                        ],
                        [
                            'location_id' => $location->id,
                            'service_id' => $apptService->id,
                            'package_id' => null,
                            'end_time' => $end,
                            'status' => 'confirmed',
                            'notes' => 'Auto-seeded for provider testing'
                        ]
                    );
                    $createdAppointments[] = $appointment->id;
                } catch (\Exception $e) {
                    Log::error('Failed to create sample appointment', [
                        'hour' => $hour,
                        'provider_id' => $targetProvider->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
            
            Log::info('Successfully seeded provider appointments', [
                'provider_id' => $targetProvider->id,
                'provider_email' => $targetProvider->email,
                'appointment_count' => count($createdAppointments),
                'appointment_ids' => $createdAppointments,
                'client_ids' => [$client->id, $client2->id ?? $client->id],
                'location_id' => $location->id,
                'service_id' => $service->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to seed sample appointments', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Store a newly created appointment (by Reception staff).
     */
    public function storeAppointmentByStaff(Request $request)
    {
        $user = Auth::user();
        
        // Only reception can create appointments
        if (!$user || $user->role !== 'reception') {
            return response()->json(['message' => 'Unauthorized - Only reception staff can create appointments'], 401);
        }
        
        // Log incoming request for debugging
        Log::info('Reception appointment creation request', [
            'user_id' => $user->id,
            'request_data' => $request->all(),
            'raw_body' => $request->getContent()
        ]);
        
        // Normalize and provide safe defaults BEFORE validation to avoid SQL errors
        $normalized = $request->all();
        // Map common alt status spellings to DB enum
        if (!empty($normalized['status'])) {
            $status = strtolower((string) $normalized['status']);
            if ($status === 'cancelled') { // British spelling → DB uses 'canceled'
                $normalized['status'] = 'canceled';
            } elseif ($status === 'confirmed' || $status === 'in-progress' || $status === 'pending' || $status === 'scheduled') {
                // Map unsupported statuses to 'booked'
                $normalized['status'] = 'booked';
            }
        }
        // Default status
        if (empty($normalized['status'])) {
            $normalized['status'] = 'booked';
        }

        // Coerce IDs: empty strings → null (for nullable), numerics → int
        foreach (['provider_id','service_id','package_id'] as $optId) {
            if (array_key_exists($optId, $normalized)) {
                $val = $normalized[$optId];
                if ($val === '' || $val === null || $val === 'none' || $val === 'null') {
                    $normalized[$optId] = null;
                } elseif (is_numeric($val)) {
                    $normalized[$optId] = (int) $val;
                }
            }
        }
        foreach (['client_id','location_id'] as $reqId) {
            if (array_key_exists($reqId, $normalized) && is_numeric($normalized[$reqId])) {
                $normalized[$reqId] = (int) $normalized[$reqId];
            }
        }

        // Normalize date formats - convert to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
        if (!empty($normalized['start_time'])) {
            try {
                $startTime = \Carbon\Carbon::parse($normalized['start_time']);
                // Convert to MySQL DATETIME format (remove T and timezone)
                $normalized['start_time'] = $startTime->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                Log::warning('Invalid start_time format', ['value' => $normalized['start_time'], 'error' => $e->getMessage()]);
            }
        }
        
        if (!empty($normalized['end_time'])) {
            try {
                $endTime = \Carbon\Carbon::parse($normalized['end_time']);
                // Convert to MySQL DATETIME format (remove T and timezone)
                $normalized['end_time'] = $endTime->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                Log::warning('Invalid end_time format', ['value' => $normalized['end_time'], 'error' => $e->getMessage()]);
            }
        }

        // Rebuild the request with normalized values for validation
        $request->replace($normalized);

        // Validate against the actual DB enum
        try {
            $validated = $request->validate([
                'client_id' => 'required|exists:clients,id',
                'start_time' => 'required|date',
                'end_time' => 'required|date|after:start_time',
                'service_id' => 'nullable|integer|exists:services,id',
                'provider_id' => 'nullable|integer|exists:users,id',
                'package_id' => 'nullable|integer|exists:packages,id',
                'location_id' => 'required|exists:locations,id',
                'status' => 'required|in:booked,completed,canceled',
                'notes' => 'nullable|string|max:1000',
            ]);
            
            Log::info('Reception appointment validation passed', [
                'validated_data' => $validated
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = $e->errors();
            Log::warning('Reception appointment validation failed', [ 
                'errors' => $errors,
                'request_data' => $request->all(),
                'request_headers' => $request->headers->all()
            ]);
            
            // Return validation errors in standard Laravel format
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $errors
            ], 422);
        } catch (\Exception $e) {
            Log::error('Unexpected validation error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'message' => 'Validation error occurred',
                'error' => $e->getMessage()
            ], 422);
        }

        try {
            // Ensure appointment_time is in MySQL DATETIME format
            $appointmentTime = $normalized['start_time'] ?? $request->start_time;
            
            $appointment = Appointment::create([
                'client_id' => (int) $request->client_id,
                'appointment_time' => $appointmentTime, // Required field - use normalized start_time
                'start_time' => $normalized['start_time'] ?? $request->start_time,
                'end_time' => $normalized['end_time'] ?? $request->end_time,
                'service_id' => $request->service_id ?: null,
                'provider_id' => $request->provider_id ?: null,
                'package_id' => $request->package_id ?: null,
                'location_id' => (int) $request->location_id,
                'status' => $request->status ?? 'booked',
                'notes' => $request->notes,
            ]);
            
            Log::info('Reception appointment created successfully', [
                'appointment_id' => $appointment->id,
                'appointment_time' => $appointment->appointment_time,
                'start_time' => $appointment->start_time
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error('Reception appointment insert failed', [
                'error' => $e->getMessage(),
                'sql_state' => method_exists($e, 'getCode') ? $e->getCode() : null,
            ]);
            return response()->json([
                'message' => 'Failed to create appointment',
                'error' => 'Database error',
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Reception appointment unexpected failure', [ 'error' => $e->getMessage() ]);
            return response()->json([
                'message' => 'Failed to create appointment',
            ], 500);
        }

        // Load relationships for notification
        $appointment->load(['client', 'provider', 'location', 'service', 'package']);

        // Send notification to provider if assigned
        if ($appointment->provider_id && $appointment->provider) {
            try {
                $appointment->provider->notify(new AppointmentCreated($appointment));
                Log::info("📨 SMS notification sent to provider: {$appointment->provider->name} for appointment #{$appointment->id}");
            } catch (\Exception $e) {
                Log::error("Failed to send notification: " . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Appointment created successfully',
            'appointment' => $appointment
        ], 201);
    }

    /**
     * Store a newly created appointment (by Client).
     */
    public function store(Request $request)
    {
        // Verify user is authenticated and is a client
        $user = Auth::user();
        if (!$user || $user->role !== 'client') {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        
        // Get the client record for this user
        $client = Client::where('user_id', $user->id)->first();
        if (!$client) {
            return response()->json(['message' => 'Client profile not found. Please contact administrator.'], 404);
        }
        
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'service_id' => 'nullable|exists:services,id',
            'provider_id' => 'nullable|exists:users,id',
            'package_id' => 'nullable|exists:packages,id',
            'location_id' => 'required|exists:locations,id',
            'status' => 'nullable|in:booked,completed,canceled',
            'notes' => 'nullable|string',
        ]);
        
        // Ensure client can only create appointments for themselves
        if ($request->client_id != $client->id) {
            return response()->json(['message' => 'Unauthorized - Cannot create appointments for other clients'], 403);
        }

        $appointment = Appointment::create([
            'client_id' => $request->client_id,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'service_id' => $request->service_id,
            'provider_id' => $request->provider_id,
            'package_id' => $request->package_id,
            'location_id' => $request->location_id,
            'status' => $request->status ?? 'booked',
            'notes' => $request->notes,
        ]);

        // Load relationships for notification
        $appointment->load(['client', 'provider', 'location', 'service', 'package']);

        // Send notification to provider if assigned
        if ($appointment->provider_id && $appointment->provider) {
            try {
                $appointment->provider->notify(new AppointmentCreated($appointment));
                Log::info("📨 SMS notification sent to provider: {$appointment->provider->name} for appointment #{$appointment->id}");
            } catch (\Exception $e) {
                Log::error("Failed to send notification: " . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Appointment created successfully',
            'appointment' => $appointment
        ], 201);
    }

    /**
     * Display the specified appointment.
     */
    public function show(Appointment $appointment)
    {
        $user = Auth::user();
        
        // Verify client role
        if ($user->role !== 'client') {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        
        // Client can only see their own appointments
        $client = Client::where('user_id', $user->id)->first();
        if (!$client) {
            return response()->json(['message' => 'Client profile not found'], 404);
        }
        
        if ($appointment->client_id !== $client->id) {
            return response()->json(['message' => 'Unauthorized - Cannot access other clients\' appointments'], 403);
        }

        // Load valid relationships  
        $appointment->load(['client', 'provider', 'location', 'service', 'package']);
        
        return response()->json([
            'id' => $appointment->id,
            'client' => [
                'id' => $appointment->client->id,
                'name' => $appointment->client->name,
                'phone' => $appointment->client->phone,
                'email' => $appointment->client->email,
            ],
            'provider' => $appointment->provider ? [
                'id' => $appointment->provider->id,
                'name' => $appointment->provider->name,
            ] : null,
            'location' => $appointment->location ? [
                'id' => $appointment->location->id,
                'name' => $appointment->location->name,
            ] : null,
            'service' => $appointment->service ? [
                'id' => $appointment->service->id,
                'name' => $appointment->service->name,
                'price' => $appointment->service->price,
            ] : null,
            'package' => $appointment->package ? [
                'id' => $appointment->package->id,
                'name' => $appointment->package->name,
            ] : null,
            'start_time' => $appointment->start_time,
            'end_time' => $appointment->end_time,
            'status' => $appointment->status,
            'notes' => $appointment->notes,
            'created_at' => $appointment->created_at,
            'updated_at' => $appointment->updated_at,
        ]);
    }

    /**
     * Update the specified appointment.
     */
    public function update(Request $request, Appointment $appointment)
    {
        $user = Auth::user();
        
        // Client can only update their own appointments
        if ($user->role === 'client') {
            $client = Client::where('user_id', $user->id)->first();
            if (!$client || $appointment->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }
        
        // Reception and Provider can update appointments (for scheduling)
        if (!in_array($user->role, ['client', 'reception', 'provider'])) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time',
            'service_id' => 'nullable|exists:services,id',
            'provider_id' => 'nullable|exists:users,id',
            'package_id' => 'nullable|exists:packages,id',
            'status' => 'nullable|in:booked,confirmed,in-progress,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $appointment->update($request->only([
            'start_time', 'end_time', 'service_id', 'provider_id', 
            'package_id', 'status', 'notes'
        ]));

        return response()->json([
            'message' => 'Appointment updated successfully',
            'appointment' => $appointment->load(['client', 'provider', 'location', 'service', 'package'])
        ]);
    }

    /**
     * Update appointment status.
     */
    public function updateStatus(Request $request, Appointment $appointment)
    {
        $user = Auth::user();
        
        // Client can only update their own appointments
        if ($user->role === 'client') {
            $client = Client::where('user_id', $user->id)->first();
            if (!$client || $appointment->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            // Client can only cancel their appointments
            $request->validate([
                'status' => 'required|in:cancelled',
            ]);
        } else {
            // Admin, reception, provider can update status
            $request->validate([
                'status' => 'required|in:booked,completed,cancelled',
            ]);
        }

        $oldStatus = $appointment->status;
        $appointment->update(['status' => $request->status]);

        // Log audit entry for admin actions
        if ($user->role === 'admin') {
            \App\Models\AuditLog::create([
                'user_id' => $user->id,
                'action' => 'update_status',
                'table_name' => 'appointments',
                'record_id' => $appointment->id,
                'old_data' => ['status' => $oldStatus],
                'new_data' => ['status' => $request->status],
            ]);
        }

        return response()->json([
            'message' => 'Appointment status updated successfully',
            'appointment' => $appointment->load(['client', 'provider', 'location', 'service', 'package'])
        ]);
    }

    /**
     * Get client's own appointments.
     */
    public function myAppointments(Request $request)
    {
        $user = Auth::user();
        
        // Verify client role
        if ($user->role !== 'client') {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        
        $client = Client::where('user_id', $user->id)->first();
        
        if (!$client) {
            return response()->json(['message' => 'Client profile not found'], 404);
        }

        $query = Appointment::with(['provider', 'location', 'service', 'package'])
            ->where('client_id', $client->id);

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date')) {
            try {
                $date = \Carbon\Carbon::createFromFormat('Y-m-d', (string) $request->date);
                if ($date !== false) {
                    $query->whereDate('start_time', $date->toDateString());
                }
            } catch (\Exception $e) {
                Log::warning('Invalid date filter provided to myAppointments', [
                    'value' => $request->date,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Fetch and transform to a safe, consistent JSON shape
        try {
        $appointments = $query->orderBy('start_time', 'desc')->get();
            $result = $appointments->map(function ($apt) {
                return [
                    'id' => $apt->id,
                    'provider' => $apt->provider ? [
                        'id' => $apt->provider->id,
                        'name' => $apt->provider->name,
                    ] : null,
                    'location' => $apt->location ? [
                        'id' => $apt->location->id,
                        'name' => $apt->location->name,
                    ] : null,
                    'service' => $apt->service ? [
                        'id' => $apt->service->id,
                        'name' => $apt->service->name,
                    ] : null,
                    'package' => $apt->package ? [
                        'id' => $apt->package->id,
                        'name' => $apt->package->name,
                    ] : null,
                    'start_time' => $apt->start_time,
                    'end_time' => $apt->end_time,
                    'status' => $apt->status,
                    'notes' => $apt->notes,
                ];
            });
            return response()->json($result->values());
        } catch (\Exception $e) {
            Log::error('myAppointments transformation failed', [
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Failed to fetch appointments',
            ], 500);
        }
    }

    /**
     * Remove the specified appointment.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        
        try {
            $appointment = Appointment::find($id);
            
            if (!$appointment) {
                return response()->json(['message' => 'Appointment not found'], 404);
            }
            
            Log::info('Delete appointment request', [
                'user_id' => $user->id,
                'user_role' => $user->role,
                'appointment_id' => $appointment->id,
                'appointment_client_id' => $appointment->client_id,
            ]);
        
        // Admin can delete any appointment with audit log
        if ($user->role === 'admin') {
            // Log audit entry before deletion
            \App\Models\AuditLog::create([
                'user_id' => $user->id,
                'action' => 'delete',
                'table_name' => 'appointments',
                'record_id' => $appointment->id,
                'old_data' => $appointment->toArray(),
                'new_data' => null,
            ]);
            
            $appointment->delete();
            
            return response()->json(['message' => 'Appointment deleted successfully']);
        }
        
        // Reception can delete appointments
        if ($user->role === 'reception') {
            $appointment->delete();
            return response()->json(['message' => 'Appointment deleted successfully']);
        }
        
        // Client can only delete their own appointments
        if ($user->role !== 'client') {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        
        $client = Client::where('user_id', $user->id)->first();
        if (!$client) {
                Log::error('Client profile not found', ['user_id' => $user->id]);
            return response()->json(['message' => 'Client profile not found'], 404);
        }
            
            Log::info('Client delete check', [
                'appointment_client_id' => $appointment->client_id,
                'logged_in_client_id' => $client->id,
                'match' => $appointment->client_id === $client->id,
            ]);
        
        if ($appointment->client_id !== $client->id) {
            return response()->json(['message' => 'Unauthorized - Cannot delete other clients\' appointments'], 403);
        }

        $appointment->delete();

        return response()->json(['message' => 'Appointment deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Error deleting appointment', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'Error deleting appointment: ' . $e->getMessage()], 500);
        }
    }
}