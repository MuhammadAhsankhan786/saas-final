<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    /**
     * Display a listing of locations.
     */
    public function index()
    {
        $locations = Location::all();
        return response()->json($locations);
    }

    /**
     * Store a newly created location.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'zip' => 'nullable|string|max:20',
            'timezone' => 'nullable|string|max:50',
        ]);

        $location = Location::create($request->all());

        return response()->json([
            'message' => 'Location created successfully',
            'location' => $location
        ], 201);
    }

    /**
     * Display the specified location.
     */
    public function show(Location $location)
    {
        return response()->json($location);
    }

    /**
     * Update the specified location.
     */
    public function update(Request $request, Location $location)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'zip' => 'nullable|string|max:20',
            'timezone' => 'nullable|string|max:50',
        ]);

        $location->update($request->all());

        return response()->json([
            'message' => 'Location updated successfully',
            'location' => $location
        ]);
    }

    /**
     * Remove the specified location.
     */
    public function destroy(Location $location)
    {
        $location->delete();

        return response()->json(['message' => 'Location deleted successfully']);
    }
}
