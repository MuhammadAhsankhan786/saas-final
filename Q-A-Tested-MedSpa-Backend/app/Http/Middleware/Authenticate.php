<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class Authenticate
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string|null  $guard
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$guards)
    {
        // Default to 'api' guard if no guard specified
        $guard = $guards[0] ?? 'api';
        
        try {
            if (!Auth::guard($guard)->check()) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }
        } catch (\Exception $e) {
            // Log the exception for debugging
            \Log::error('Auth middleware error: ' . $e->getMessage());
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}

