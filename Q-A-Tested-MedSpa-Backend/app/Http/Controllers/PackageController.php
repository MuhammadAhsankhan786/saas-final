<?php

namespace App\Http\Controllers;

use App\Models\Package;
use App\Models\Client;
use App\Models\ClientPackage;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf as PDF;

class PackageController extends Controller
{
    /**
     * List all packages
     */
    public function index()
    {
        $packages = Package::all();
        return response()->json($packages);
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

        $packages = ClientPackage::with('package')
            ->where('client_id', $user->id)
            ->get();

        return response()->json($packages);
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
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration' => 'nullable|integer|min:1',
            'services_included' => 'nullable|array',
        ]);

        $package = Package::create($request->all());
        return response()->json($package, 201);
    }

    /**
     * Update the specified package
     */
    public function update(Request $request, $id)
    {
        $package = Package::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'duration' => 'nullable|integer|min:1',
            'services_included' => 'nullable|array',
        ]);

        $package->update($request->all());
        return response()->json($package);
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
        // Get all packages
        $packages = Package::all();
        
        // Calculate package statistics
        $totalPackages = $packages->count();
        $totalValue = $packages->sum('price');
        $avgPrice = $packages->avg('price');
        
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
    }
}
