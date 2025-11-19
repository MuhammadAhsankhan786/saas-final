<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class ProfileController extends Controller
{
    /**
     * Get current user profile
     */
    public function getProfile(): JsonResponse
    {
        $user = Auth::user();
        
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'location_id' => $user->location_id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'title' => $user->title,
            'department' => $user->department,
            'bio' => $user->bio,
            'address' => $user->address,
            'city' => $user->city,
            'state' => $user->state,
            'zip_code' => $user->zip_code,
            'date_of_birth' => $user->date_of_birth,
            'emergency_contact' => $user->emergency_contact,
            'emergency_phone' => $user->emergency_phone,
            'profile_image' => $user->profile_image ? url(Storage::url($user->profile_image)) : null,
            'notification_preferences' => $user->notification_preferences ?? [
                'email' => true,
                'sms' => true,
                'push' => false,
                'appointmentReminders' => true,
                'systemUpdates' => true,
                'marketing' => false,
            ],
            'privacy_settings' => $user->privacy_settings ?? [
                'profileVisibility' => 'staff',
                'showEmail' => false,
                'showPhone' => true,
                'allowDirectMessages' => true,
            ],
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            $validated = $request->validate([
                'first_name' => 'nullable|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255|unique:users,email,' . $user->id,
                'phone' => 'nullable|string|max:20',
                'title' => 'nullable|string|max:255',
                'department' => 'nullable|string|max:255',
                'bio' => 'nullable|string',
                'address' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:255',
                'state' => 'nullable|string|max:255',
                'zip_code' => 'nullable|string|max:10',
                'date_of_birth' => 'nullable|date',
                'emergency_contact' => 'nullable|string|max:255',
                'emergency_phone' => 'nullable|string|max:20',
                'notification_preferences' => 'nullable|array',
                'privacy_settings' => 'nullable|array',
            ]);

            // Filter out null/empty values and only update provided fields
            // But keep JSON fields even if empty arrays
            // Also exclude read-only fields that shouldn't be updated
            $readOnlyFields = ['id', 'name', 'role', 'location_id', 'profile_image'];
            $updateData = [];
            foreach ($validated as $key => $value) {
                // Skip read-only fields
                if (in_array($key, $readOnlyFields)) {
                    continue;
                }
                
                if ($key === 'notification_preferences' || $key === 'privacy_settings') {
                    // Always include JSON fields (model will handle casting)
                    if ($value !== null) {
                        $updateData[$key] = $value;
                    }
                } else {
                    // For other fields, skip null/empty
                    if ($value !== null && $value !== '') {
                        $updateData[$key] = $value;
                    }
                }
            }

            // Update user profile (model casts will handle JSON encoding)
            $user->update($updateData);

            return response()->json([
                'message' => 'Profile updated successfully',
                'data' => $this->getProfile()->getData()
            ]);
        } catch (\Exception $e) {
            \Log::error('Profile update error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'message' => 'Failed to update profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload profile photo
     */
    public function uploadProfilePhoto(Request $request): JsonResponse
    {
        $request->validate([
            'profile_photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $user = Auth::user();
        
        // Delete old profile photo if exists
        if ($user->profile_image) {
            Storage::disk('public')->delete($user->profile_image);
        }

        // Store new photo
        $path = $request->file('profile_photo')->store('profile-photos', 'public');
        
        // Update user profile with new photo path
        $user->update(['profile_image' => $path]);

        return response()->json([
            'message' => 'Profile photo uploaded successfully',
            'profile_image' => $path,
            'profile_image_url' => url(Storage::url($path))
        ]);
    }

    /**
     * Delete profile photo
     */
    public function deleteProfilePhoto(): JsonResponse
    {
        $user = Auth::user();
        
        if ($user->profile_image) {
            Storage::disk('public')->delete($user->profile_image);
            $user->update(['profile_image' => null]);
        }

        return response()->json([
            'message' => 'Profile photo deleted successfully'
        ]);
    }
}
