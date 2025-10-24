<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SensitiveActionTimeout
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Check if user has been inactive for more than 15 minutes for sensitive actions
        $lastActivity = $user->last_activity_at ?? $user->created_at;
        $inactiveMinutes = now()->diffInMinutes($lastActivity);

        if ($inactiveMinutes > 15) {
            return response()->json([
                'message' => 'Session expired. Please re-authenticate for sensitive actions.',
                'requires_reauth' => true
            ], 401);
        }

        return $next($request);
    }
}
