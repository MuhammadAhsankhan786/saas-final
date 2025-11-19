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
        try {
            $locations = Location::orderBy('created_at', 'desc')->get();
            \Log::info('Locations fetched: ' . $locations->count() . ' locations found');
            
            // Log first location for debugging
            if ($locations->count() > 0) {
                \Log::info('First location sample: ' . json_encode($locations->first()->toArray()));
            }
            
            return response()->json($locations);
        } catch (\Exception $e) {
            \Log::error('Error fetching locations: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to fetch locations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created location.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'address' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:100',
                'state' => 'nullable|string|max:100',
                'zip' => 'nullable|string|max:20',
                'phone' => 'nullable|string|max:20',
                'timezone' => 'nullable|string|max:50',
                'status' => 'nullable|in:active,inactive',
            ]);

            // Set default status if not provided
            if (!isset($validated['status'])) {
                $validated['status'] = 'active';
            }

            // Set default timezone if not provided (required field in DB)
            if (!isset($validated['timezone']) || empty($validated['timezone'])) {
                $validated['timezone'] = 'UTC';
            }

            \Log::info('Creating location with data: ' . json_encode($validated));

            // Only include fields that exist in the database
            $locationData = [
                'name' => $validated['name'],
                'address' => $validated['address'] ?? null,
                'city' => $validated['city'] ?? null,
                'state' => $validated['state'] ?? null,
                'zip' => $validated['zip'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'timezone' => $validated['timezone'],
                'status' => $validated['status'],
            ];

            \Log::info('Location data to insert: ' . json_encode($locationData));

            $location = Location::create($locationData);
            
            // Refresh the location from database to ensure all fields are loaded
            $location->refresh();
            
            \Log::info('Location created successfully - ID: ' . $location->id . ', Name: ' . $location->name);
            \Log::info('Location data from DB: ' . json_encode($location->toArray()));

            // Verify the location was actually saved
            $savedLocation = Location::find($location->id);
            if (!$savedLocation) {
                throw new \Exception('Location was not saved to database');
            }

            return response()->json([
                'message' => 'Location created successfully',
                'location' => $savedLocation
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Location validation error: ' . json_encode($e->errors()));
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Location creation error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to create location',
                'error' => $e->getMessage()
            ], 500);
        }
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
        try {
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'address' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:100',
                'state' => 'nullable|string|max:100',
                'zip' => 'nullable|string|max:20',
                'phone' => 'nullable|string|max:20',
                'timezone' => 'nullable|string|max:50',
                'status' => 'nullable|in:active,inactive',
            ]);

            $location->update($validated);
            $location->refresh();

            \Log::info('Location updated: ' . $location->id);

            return response()->json([
                'message' => 'Location updated successfully',
                'location' => $location
            ]);
        } catch (\Exception $e) {
            \Log::error('Location update error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update location',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified location.
     */
    public function destroy(Location $location)
    {
        try {
            $locationId = $location->id;
            $locationName = $location->name;
            $location->delete();

            \Log::info('Location deleted: ' . $locationId . ' - ' . $locationName);

            return response()->json(['message' => 'Location deleted successfully']);
        } catch (\Exception $e) {
            \Log::error('Location delete error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete location',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
