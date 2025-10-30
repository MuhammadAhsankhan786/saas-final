<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminReadOnlyMiddleware
{
    /**
     * Handle an incoming request.
     * Blocks all write operations (POST, PUT, PATCH, DELETE) for admin role.
     * Only allows GET requests for view-only access.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();
        
        // Only apply to authenticated admin users
        if ($user && $user->role === 'admin') {
            // Allow only GET requests (read-only)
            if (!in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'])) {
                return response()->json([
                    'error' => 'Admins have view-only access.',
                    'message' => 'Admin role is restricted to viewing data only. No modifications allowed.',
                ], 403);
            }
        }
        
        return $next($request);
    }
}