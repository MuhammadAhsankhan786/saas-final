<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    /**
     * Display a listing of appointments with filters.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Appointment::with(['client.clientUser', 'provider', 'location', 'service', 'package']);

        // Apply role-based filtering
        if ($user->role === 'client') {
            $client = Client::where('user_id', $user->id)->first();
            if ($client) {
                $query->where('client_id', $client->id);
            } else {
                return response()->json(['message' => 'Client profile not found'], 404);
            }
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
     * Store a newly created appointment.
     */
    public function store(Request $request)
    {
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

        return response()->json([
            'message' => 'Appointment created successfully',
            'appointment' => $appointment->load(['client.clientUser', 'provider', 'location', 'service', 'package'])
        ], 201);
    }

    /**
     * Display the specified appointment.
     */
    public function show(Appointment $appointment)
    {
        $user = Auth::user();
        
        // Client can only see their own appointments
        if ($user->role === 'client') {
            $client = Client::where('user_id', $user->id)->first();
            if (!$client || $appointment->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        return response()->json($appointment->load(['client.clientUser', 'provider', 'location', 'service', 'package']));
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

        $request->validate([
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time',
            'service_id' => 'nullable|exists:services,id',
            'provider_id' => 'nullable|exists:users,id',
            'package_id' => 'nullable|exists:packages,id',
            'status' => 'nullable|in:booked,completed,canceled',
            'notes' => 'nullable|string',
        ]);

        $appointment->update($request->only([
            'start_time', 'end_time', 'service_id', 'provider_id', 
            'package_id', 'status', 'notes'
        ]));

        return response()->json([
            'message' => 'Appointment updated successfully',
            'appointment' => $appointment->load(['client.clientUser', 'provider', 'location', 'service', 'package'])
        ]);
    }

    /**
     * Update appointment status.
     */
    public function updateStatus(Request $request, Appointment $appointment)
    {
        $request->validate([
            'status' => 'required|in:booked,completed,canceled',
        ]);

        $appointment->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Appointment status updated successfully',
            'appointment' => $appointment->load(['client.clientUser', 'provider', 'location', 'service', 'package'])
        ]);
    }

    /**
     * Get client's own appointments.
     */
    public function myAppointments(Request $request)
    {
        $user = Auth::user();
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
    public function destroy(Appointment $appointment)
    {
        $user = Auth::user();
        
        // Client can only delete their own appointments
        if ($user->role === 'client') {
            $client = Client::where('user_id', $user->id)->first();
            if (!$client || $appointment->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $appointment->delete();

        return response()->json(['message' => 'Appointment deleted successfully']);
    }
}