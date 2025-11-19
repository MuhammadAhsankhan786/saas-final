<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Handle unauthenticated users (API safe).
     */
    protected function unauthenticated($request, AuthenticationException $exception)
    {
        // Always return JSON for API routes
        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['error' => 'Unauthenticated.', 'message' => 'Unauthenticated.'], 401);
        }

        // For web routes, redirect to login (but we're API-only, so this shouldn't happen)
        return response()->json(['error' => 'Unauthenticated.', 'message' => 'Unauthenticated.'], 401);
    }
}
