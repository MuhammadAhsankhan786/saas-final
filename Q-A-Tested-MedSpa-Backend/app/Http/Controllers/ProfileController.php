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
            'profile_image' => $user->profile_image ? Storage::url($user->profile_image) : null,
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

        // Update user profile
        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => $this->getProfile()->getData()
        ]);
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
            'profile_image_url' => Storage::url($path)
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
