<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProviderOnlyMiddleware
{
    /**
     * Allow only Provider role.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        if (!$user) {
            Log::warning('Unauthenticated access attempt to provider route', [
                'path' => $request->path(),
                'ip' => $request->ip(),
            ]);
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Authentication required',
            ], 401);
        }

        if ($user->role !== 'provider') {
            Log::warning('Unauthorized role attempt to access provider route', [
                'user_id' => $user->id,
                'user_role' => $user->role,
                'path' => $request->path(),
                'ip' => $request->ip(),
            ]);
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Access restricted for this role',
            ], 403);
        }

        return $next($request);
    }
}

