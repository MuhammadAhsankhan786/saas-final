<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AdminUserController extends Controller
{
    /**
     * Display a listing of users/staff (READ-ONLY for admin)
     * Returns safe JSON with no sensitive fields (passwords, tokens, etc.)
     */
    public function index()
    {
        try {
            // Get all users (staff includes provider, reception, staff roles)
            $users = User::with('location')
                ->whereIn('role', ['provider', 'reception', 'staff', 'admin'])
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'role_label' => ucfirst($user->role),
                        'location_id' => $user->location_id,
                        'location' => $user->location ? [
                            'id' => $user->location->id,
                            'name' => $user->location->name,
                        ] : null,
                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,
                        'title' => $user->title,
                        'department' => $user->department,
                        'created_at' => $user->created_at,
                        'updated_at' => $user->updated_at,
                        // Explicitly exclude: password, tokens, notes, sensitive data
                    ];
                });
            
            return response()->json($users);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Admin users index error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([]);
        }
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'nullable|string|min:8',
            'role' => 'required|string|in:admin,provider,reception,client',
            'location_id' => 'required|exists:locations,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Auto-generate password if not provided
        $password = $request->password ?? \Illuminate\Support\Str::random(10);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($password),
            'role' => $request->role,
            'location_id' => $request->location_id,
        ]);

        return response()->json($user->load('location'), 201);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $id,
            'password' => 'sometimes|nullable|string|min:8',
            'role' => 'sometimes|string|in:admin,provider,reception,client',
            'location_id' => 'sometimes|nullable|exists:locations,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updateData = $request->only(['name', 'email', 'role', 'location_id']);
        
        if ($request->has('password') && !empty($request->password)) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return response()->json($user->load('location'));
    }

    /**
     * Remove the specified user.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}