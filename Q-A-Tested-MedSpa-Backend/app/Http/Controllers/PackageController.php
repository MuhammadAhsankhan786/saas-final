<?php

namespace App\Http\Controllers;

use App\Models\Package;
use App\Models\Client;
use App\Models\ClientPackage;
use Illuminate\Http\Request;

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
            'client_package' => $clientPackage->load('package','client.user')
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
}
