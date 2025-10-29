<?php

namespace App\Http\Controllers;

use App\Models\Treatment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TreatmentController extends Controller
{
    /**
     * Display a listing of treatments.
     */
    public function index()
    {
        $user = auth()->user();

        $query = Treatment::with(['appointment.client.clientUser', 'appointment.staff']);

        // Client → only their own treatments
        if ($user->role === 'client') {
            $query->whereHas('appointment', function ($q) use ($user) {
                $q->where('client_id', $user->id);
            });
        } elseif ($user->role === 'provider') {
            // Provider only sees their own treatments
            $query->where('provider_id', $user->id);
        }

        return response()->json($query->get(), 200);
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
