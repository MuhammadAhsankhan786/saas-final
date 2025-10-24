<?php

namespace App\Http\Controllers;

use App\Models\ClientPackage;
use Illuminate\Http\Request;

class ClientPackageController extends Controller
{
    // List client packages
    public function index()
    {
        $user = auth()->user();
        $query = ClientPackage::with(['client.clientUser', 'package']);

        if ($user->role === 'client') {
            $query->where('client_id', $user->id);
        }

        return response()->json($query->get());
    }

    // Store a new client package
    public function store(Request $request)
    {
        $request->validate([
            'client_id'  => 'required|exists:clients,id',
            'package_id' => 'required|exists:packages,id',
            'start_date' => 'required|date',
            'end_date'   => 'nullable|date|after_or_equal:start_date',
            'status'     => 'required|in:active,completed,canceled',
        ]);

        $package = ClientPackage::create($request->all());

        return response()->json([
            'message' => 'Client package assigned successfully',
            'package' => $package->load(['client.clientUser','package'])
        ], 201);
    }

    // Show specific client package
    public function show($id)
    {
        $package = ClientPackage::with(['client.clientUser','package'])->findOrFail($id);
        $user = auth()->user();

        if ($user->role === 'client' && $package->client_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($package);
    }

    // Update client package
    public function update(Request $request, $id)
    {
        $package = ClientPackage::findOrFail($id);

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date|after_or_equal:start_date',
            'status'     => 'nullable|in:active,completed,canceled',
        ]);

        $package->update($request->only(['start_date','end_date','status']));

        return response()->json([
            'message' => 'Client package updated successfully',
            'package' => $package->load(['client.clientUser','package'])
        ]);
    }

    // Delete client package
    public function destroy($id)
    {
        $package = ClientPackage::findOrFail($id);
        $package->delete();

        return response()->json(['message' => 'Client package deleted successfully']);
    }
}
