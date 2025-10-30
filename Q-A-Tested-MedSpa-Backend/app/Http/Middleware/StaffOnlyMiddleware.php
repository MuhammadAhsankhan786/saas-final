<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StaffOnlyMiddleware
{
    /**
     * Handle an incoming request.
     * Allows only 'reception', 'staff', and 'provider' roles to access /staff/* routes.
     * Returns 403 for all other roles (admin, client, etc.)
     */
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();
        
        // Must be authenticated
        if (!$user) {
            Log::warning('Unauthenticated access attempt to staff route', [
                'path' => $request->path(),
                'ip' => $request->ip(),
            ]);
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Authentication required'
            ], 401);
        }
        
        // Only allow reception, staff, provider roles
        $allowedRoles = ['reception', 'staff', 'provider'];
        
        if (!in_array($user->role, $allowedRoles)) {
            Log::warning('Unauthorized role attempt to access staff route', [
                'user_id' => $user->id,
                'user_role' => $user->role,
                'path' => $request->path(),
                'ip' => $request->ip(),
                'allowed_roles' => $allowedRoles,
            ]);
            
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Access restricted for this role'
            ], 403);
        }
        
        return $next($request);
    }
}

