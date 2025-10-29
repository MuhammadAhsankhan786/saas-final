<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Client;
use App\Notifications\AppointmentCreated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        $query = Appointment::with(['client', 'provider', 'location', 'service', 'package']);

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

        if ($request->has('date')) {
            $query->whereDate('start_time', $request->date);
        }

        if ($request->has('date_from')) {
            $query->whereDate('start_time', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('start_time', '<=', $request->date_to);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $appointments = $query->orderBy('start_time', 'desc')->get();

        return response()->json($appointments);
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
        
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'service_id' => 'nullable|exists:services,id',
            'provider_id' => 'nullable|exists:users,id',
            'package_id' => 'nullable|exists:packages,id',
            'location_id' => 'required|exists:locations,id',
            'status' => 'nullable|in:booked,confirmed,in-progress,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

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
            $query->whereDate('start_time', $request->date);
        }

        $appointments = $query->orderBy('start_time', 'desc')->get();

        return response()->json($appointments);
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