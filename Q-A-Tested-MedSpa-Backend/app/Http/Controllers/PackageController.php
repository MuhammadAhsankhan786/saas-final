<?php

namespace App\Http\Controllers;

use App\Models\Package;
use App\Models\Client;
use App\Models\ClientPackage;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use App\Http\Controllers\DatabaseSeederController;
use Illuminate\Support\Facades\Log;

class PackageController extends Controller
{
    /**
     * List all packages
     */
    public function index()
    {
        try {
            $packages = Package::all();
            
            // If no data, check and seed all missing tables, then reload
            if ($packages->isEmpty()) {
                $seeded = DatabaseSeederController::seedMissingData();
                if (in_array('packages', $seeded) || !Package::query()->exists()) {
                    Log::info('No packages found; data seeded automatically...');
                    $packages = Package::all();
                }
            }
            
            return response()->json($packages);
        } catch (\Exception $e) {
            Log::error('Package index failed', ['error' => $e->getMessage()]);
            return response()->json([]);
        }
    }

    /**
     * Admin: assign package to client
     */
    public function assignToClient(Request $request)
    {
        $request->validate([
            'client_id'  => 'required|exists:clients,id',
            'package_id' => 'required|exists:packages,id',
        ]);

        $clientPackage = ClientPackage::create([
            'client_id'  => $request->client_id,
            'package_id' => $request->package_id,
            'assigned_at'=> now(),
        ]);

        return response()->json([
            'message' => 'Package assigned to client successfully',
            'client_package' => $clientPackage
        ], 201);
    }

    /**
     * Client: list assigned packages
     */
    public function myPackages()
    {
        $user = auth()->user();
        
        // Get client record for this user
        $client = \App\Models\Client::where('user_id', $user->id)->first();
        
        if (!$client) {
            return response()->json(['message' => 'Client profile not found'], 404);
        }

        $clientPackages = ClientPackage::with('package')
            ->where('client_id', $client->id)
            ->get();

        // Flatten the response: merge package data with client_package metadata
        $packages = $clientPackages->map(function($clientPackage) {
            $package = $clientPackage->package;
            if (!$package) {
                return null;
            }
            
            // Merge package data with client_package metadata
            return array_merge($package->toArray(), [
                'client_package_id' => $clientPackage->id,
                'assigned_at' => $clientPackage->assigned_at,
                'renewal_date' => $clientPackage->renewal_date ?? null,
            ]);
        })->filter(); // Remove any null entries

        return response()->json($packages->values());
    }

    /**
     * Show single package (all roles)
     */
    public function show($id)
    {
        $package = Package::findOrFail($id);
        return response()->json($package);
    }

    /**
     * Store a newly created package
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'required|numeric|min:0',
                'duration' => 'nullable|integer|min:1',
                'services_included' => 'nullable|array',
            ]);

            // Only use fillable fields to prevent mass assignment issues
            $packageData = [
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'price' => $validated['price'],
                'duration' => $validated['duration'] ?? null,
                'services_included' => $validated['services_included'] ?? null,
            ];

            \Log::info('Creating package with data: ' . json_encode($packageData));

            $package = Package::create($packageData);

            // Refresh to ensure all fields are loaded
            $package->refresh();

            \Log::info('Package created successfully - ID: ' . $package->id . ', Name: ' . $package->name);

            return response()->json($package, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Package validation error: ' . json_encode($e->errors()));
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Package creation error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to create package',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified package
     */
    public function update(Request $request, $id)
    {
        try {
            $package = Package::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'price' => 'sometimes|numeric|min:0',
                'duration' => 'nullable|integer|min:1',
                'services_included' => 'nullable|array',
            ]);

            // Only use fillable fields to prevent mass assignment issues
            $packageData = [];
            if (isset($validated['name'])) {
                $packageData['name'] = $validated['name'];
            }
            if (isset($validated['description'])) {
                $packageData['description'] = $validated['description'];
            }
            if (isset($validated['price'])) {
                $packageData['price'] = $validated['price'];
            }
            if (isset($validated['duration'])) {
                $packageData['duration'] = $validated['duration'];
            }
            if (isset($validated['services_included'])) {
                $packageData['services_included'] = $validated['services_included'];
            }

            \Log::info('Updating package ' . $id . ' with data: ' . json_encode($packageData));

            $package->update($packageData);
            $package->refresh();

            \Log::info('Package updated successfully - ID: ' . $package->id);

            return response()->json($package);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Package validation error: ' . json_encode($e->errors()));
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Package update error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to update package',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified package
     */
    public function destroy($id)
    {
        $package = Package::findOrFail($id);
        $package->delete();
        return response()->json(['message' => 'Package deleted successfully']);
    }

    /**
     * Generate Packages Report PDF
     */
    public function generatePackagesPDF(Request $request)
    {
        try {
            // Get all packages
            $packages = Package::all();
            
            // Calculate package statistics
            $totalPackages = $packages->count();
            $totalValue = $packages->sum('price') ?? 0;
            $avgPrice = $packages->avg('price') ?? 0;
            
            // Get assignment statistics
            $totalAssignments = ClientPackage::count();
            $assignedPackages = ClientPackage::with('package')
                ->get()
                ->groupBy('package_id')
                ->map(function($assignments, $packageId) {
                    $package = $assignments->first()->package;
                    return [
                        'package_id' => $packageId,
                        'package_name' => $package ? $package->name : 'Unknown Package',
                        'assignments_count' => $assignments->count(),
                        'package_price' => $package ? $package->price : 0
                    ];
                })
                ->sortByDesc('assignments_count');

            $pdf = PDF::loadView('packages.report', compact(
                'packages', 'totalPackages', 'totalValue', 'avgPrice', 
                'totalAssignments', 'assignedPackages'
            ));
            
            return $pdf->download('packages-summary.pdf');
        } catch (\Exception $e) {
            Log::error('Package PDF generation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to generate PDF report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
