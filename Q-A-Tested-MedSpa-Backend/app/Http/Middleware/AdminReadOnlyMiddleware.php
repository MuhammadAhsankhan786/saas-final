<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminReadOnlyMiddleware
{
    /**
     * Handle an incoming request.
     * Admin role is restricted to GET requests only (read-only access).
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        
        // Check if user is authenticated and is admin
        if ($user && $user->role === 'admin') {
            // Allow only GET and HEAD requests for admin
            if (!in_array($request->method(), ['GET', 'HEAD'])) {
                return response()->json([
                    'message' => 'Forbidden: Admin role has read-only access',
                    'error' => 'You do not have permission to modify data. Admin accounts are restricted to view-only operations.',
                ], 403);
            }
        }
        
        return $next($request);
    }
}


