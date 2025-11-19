<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'admin.readonly' => \App\Http\Middleware\AdminReadOnlyMiddleware::class,
            'staff.only' => \App\Http\Middleware\StaffOnlyMiddleware::class,
            'reception.only' => \App\Http\Middleware\ReceptionOnlyMiddleware::class,
            'provider.only' => \App\Http\Middleware\ProviderOnlyMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
