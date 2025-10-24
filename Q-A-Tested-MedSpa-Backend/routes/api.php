<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\ConsentFormController;
use App\Http\Controllers\TreatmentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\StockNotificationController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ServiceController;
/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Routes (JWT Auth Required)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:api')->group(function () {

    // 🔹 Auth actions
    Route::get('me', [AuthController::class, 'me']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);

    /*
    |--------------------------------------------------------------------------
    | Admin routes
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth:api', 'App\Http\Middleware\RoleMiddleware:admin'])->prefix('admin')->group(function () {
        Route::get('appointments', [AppointmentController::class, 'index']);
        Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);
        Route::patch('appointments/{appointment}/status', [AppointmentController::class, 'updateStatus']);

        Route::apiResource('consent-forms', ConsentFormController::class);
        Route::apiResource('treatments', TreatmentController::class);

        Route::apiResource('payments', PaymentController::class);
        Route::post('payments/{payment}/confirm-stripe', [PaymentController::class, 'confirmStripePayment']);
        Route::get('payments/{payment}/receipt', [PaymentController::class, 'generateReceipt']);

        Route::apiResource('packages', PackageController::class);
        Route::post('packages/assign', [PackageController::class, 'assignToClient']);

        // ✅ Users Management
        Route::get('users', [AdminUserController::class, 'index']);
        Route::post('users', [AdminUserController::class, 'store']);
        Route::put('users/{id}', [AdminUserController::class, 'update']);
        Route::delete('users/{id}', [AdminUserController::class, 'destroy']);

        // ✅ Clients Management
        Route::apiResource('clients', ClientController::class);

        // ✅ Services Management
        Route::apiResource('services', ServiceController::class);

        // ✅ Inventory: Admin full control
        Route::apiResource('products', ProductController::class);
        Route::post('products/{product}/adjust', [StockAdjustmentController::class, 'store']);
        Route::get('stock-notifications', [StockNotificationController::class, 'index']);
        Route::post('stock-notifications/{notification}/read', [StockNotificationController::class, 'markAsRead']);

        // Reports & Analytics
        Route::get('reports/revenue', [ReportsController::class, 'revenue']);
        Route::get('reports/client-retention', [ReportsController::class, 'clientRetention']);
        Route::get('reports/staff-performance', [ReportsController::class, 'staffPerformance']);

        // Locations Management
        Route::apiResource('locations', LocationController::class);
    });

    /*
    |--------------------------------------------------------------------------
    | Staff (provider + reception) routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:provider,reception')->prefix('staff')->group(function () {
        Route::get('appointments', [AppointmentController::class, 'index']);
        Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);
        Route::patch('appointments/{appointment}/status', [AppointmentController::class, 'updateStatus']);

        Route::apiResource('consent-forms', ConsentFormController::class);
        Route::apiResource('treatments', TreatmentController::class);

        Route::apiResource('payments', PaymentController::class)->only(['index','show']);
        Route::post('payments/{payment}/confirm-stripe', [PaymentController::class, 'confirmStripePayment']);
        Route::get('payments/{payment}/receipt', [PaymentController::class, 'generateReceipt']);

        Route::apiResource('packages', PackageController::class)->only(['index','show']);

        // ✅ Services: Staff can view
        Route::apiResource('services', ServiceController::class)->only(['index','show']);

        // ✅ Inventory: Staff allowed
        Route::apiResource('products', ProductController::class);
        Route::post('products/{product}/adjust', [StockAdjustmentController::class, 'store']);
        Route::get('stock-notifications', [StockNotificationController::class, 'index']);
        Route::post('stock-notifications/{notification}/read', [StockNotificationController::class, 'markAsRead']);
    });

    /*
    |--------------------------------------------------------------------------
    | Client routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:client')->prefix('client')->group(function () {
        Route::get('appointments', [AppointmentController::class, 'myAppointments']);
        Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);
        Route::post('appointments', [AppointmentController::class, 'store']);
        Route::delete('appointments/{appointment}', [AppointmentController::class, 'destroy']);

        Route::apiResource('consent-forms', ConsentFormController::class)->only([
            'index', 'store', 'show', 'update', 'destroy'
        ]);

        Route::apiResource('treatments', TreatmentController::class)->only([
            'index', 'store', 'show'
        ]);

        // ✅ Payments: create + view own + confirm Stripe
        Route::get('payments', [PaymentController::class, 'myPayments']);
        Route::post('payments', [PaymentController::class, 'store']);
        Route::post('payments/{payment}/confirm-stripe', [PaymentController::class, 'confirmStripePayment']);
        Route::get('payments/{payment}/receipt', [PaymentController::class, 'generateReceipt']);

        Route::get('packages', [PackageController::class, 'myPackages']);
    });

    /*
    |--------------------------------------------------------------------------
    | Notifications (all roles)
    |--------------------------------------------------------------------------
    */
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread', [NotificationController::class, 'unread']);
    Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    
    // Secure file access
    Route::get('files/consent-forms/{id}/{filename}', [FileController::class, 'consentForm']);
    Route::get('files/treatments/{id}/{type}', [FileController::class, 'treatmentPhoto']);
    Route::post('files/signed-url', [FileController::class, 'signedUrl']);
    
    Route::post('/stripe/webhook', [StripeWebhookController::class, 'handleWebhook']);
});
