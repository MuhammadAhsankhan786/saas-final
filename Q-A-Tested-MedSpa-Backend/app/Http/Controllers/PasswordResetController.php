<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class PasswordResetController extends Controller
{
    /**
     * Send password reset link
     */
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        try {
            // Check if user exists
            $user = User::where('email', $request->email)->first();
            
            if (!$user) {
                // Don't reveal if email exists or not for security
                return response()->json([
                    'message' => 'If that email address exists in our system, we will send a password reset link.'
                ], 200);
            }

            // Send password reset link using Laravel's built-in Password facade
            $status = Password::sendResetLink(
                $request->only('email')
            );

            if ($status === Password::RESET_LINK_SENT) {
                Log::info('Password reset link sent', ['email' => $request->email]);
                return response()->json([
                    'message' => 'Password reset link has been sent to your email address.'
                ], 200);
            } else {
                Log::warning('Password reset link failed', [
                    'email' => $request->email,
                    'status' => $status
                ]);
                return response()->json([
                    'message' => 'Unable to send password reset link. Please try again later.'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Password reset link error', [
                'email' => $request->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'An error occurred while sending the password reset link.'
            ], 500);
        }
    }

    /**
     * Reset password
     */
    public function reset(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Reset password using Laravel's built-in Password facade
            $status = Password::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function ($user, $password) {
                    $user->password = Hash::make($password);
                    $user->save();
                }
            );

            if ($status === Password::PASSWORD_RESET) {
                Log::info('Password reset successful', ['email' => $request->email]);
                return response()->json([
                    'message' => 'Password has been reset successfully.'
                ], 200);
            } else {
                Log::warning('Password reset failed', [
                    'email' => $request->email,
                    'status' => $status
                ]);
                
                $errorMessage = 'Unable to reset password.';
                if ($status === Password::INVALID_TOKEN) {
                    $errorMessage = 'Invalid or expired reset token.';
                } elseif ($status === Password::INVALID_USER) {
                    $errorMessage = 'Invalid user.';
                }

                return response()->json([
                    'message' => $errorMessage
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Password reset error', [
                'email' => $request->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'An error occurred while resetting the password.'
            ], 500);
        }
    }
}
