<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\User;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ClientController extends Controller
{
    /**
     * Display a listing of clients.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Client::with(['clientUser', 'location', 'appointments']);

        // Provider only sees their own assigned clients
        if ($user && $user->role === 'provider') {
            $query->where('preferred_provider_id', $user->id);
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

        $clients = $query->get();
        return response()->json($clients);
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
        $client = Client::with(['clientUser', 'location', 'appointments.provider'])
                        ->findOrFail($id);
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
