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
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\StockNotificationController;
use App\Http\Controllers\StockAlertController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\ComplianceAlertController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\BusinessSettingsController;
/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

// Webhook routes (must be outside auth middleware)
Route::post('stripe/webhook', [StripeWebhookController::class, 'handleWebhook']);

/*
|--------------------------------------------------------------------------
| Protected Routes (JWT Auth Required)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:api')->group(function () {

    // 🔹 Auth actions
    // Explicit auth check route
    Route::get('me', [AuthController::class, 'me']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);

    // 🔹 Profile Management (all authenticated users)
    Route::get('profile', [ProfileController::class, 'getProfile']);
    Route::put('profile', [ProfileController::class, 'updateProfile']);
    Route::post('profile/photo', [ProfileController::class, 'uploadProfilePhoto']);
    Route::delete('profile/photo', [ProfileController::class, 'deleteProfilePhoto']);

    // 🔹 Business Settings Management (all authenticated users)
    Route::get('business-settings', [BusinessSettingsController::class, 'index']);
    Route::put('business-settings', [BusinessSettingsController::class, 'update']);

    /*
    |--------------------------------------------------------------------------
    | Admin routes - READ-ONLY ACCESS ONLY
    |--------------------------------------------------------------------------
    */
    // Admin routes require admin role
    Route::middleware(['auth:api', 'role:admin'])->prefix('admin')->group(function () {
        // 📊 Dashboard - Summary Statistics (View Only)
        Route::get('dashboard', [AdminDashboardController::class, 'getStats']);
        
        // 📋 Appointments - View Only
        Route::get('appointments', [AppointmentController::class, 'index']);
        Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);

        // 👥 Staff Management - View Only (users endpoint for backward compatibility)
        Route::get('users', [AdminUserController::class, 'index']);
        Route::get('staff', [AdminUserController::class, 'index']); // Alias for clarity

        // ✅ Clients Management - View Only
        Route::get('clients', [ClientController::class, 'index']);
        Route::get('clients/{client}', [ClientController::class, 'show']);

        // 💰 Payments - View Only
        Route::get('payments', [PaymentController::class, 'index']);
        Route::get('payments/{payment}', [PaymentController::class, 'show']);
        Route::get('payments/{payment}/receipt', [PaymentController::class, 'generateReceipt']);

        // 📦 Packages - View Only
        Route::get('packages', [PackageController::class, 'index']);
        Route::get('packages/{package}', [PackageController::class, 'show']);

        // 🏥 Services - View Only
        Route::get('services', [ServiceController::class, 'index']);
        Route::get('services/{service}', [ServiceController::class, 'show']);

        // 📦 Inventory - View Only
        // IMPORTANT: Specific routes (pdf) must come BEFORE {product} route to avoid route collision
        Route::get('products', [ProductController::class, 'index']);
        Route::get('products/pdf', [ProductController::class, 'generateInventoryPDF']);
        Route::get('inventory/pdf', [ProductController::class, 'generateInventoryPDF']); // Alias for backward compatibility
        Route::get('products/{product}', [ProductController::class, 'show']);
        Route::get('stock-notifications', [StockNotificationController::class, 'index']);
        
        // Stock Alerts - View Only
        Route::get('stock-alerts', [StockAlertController::class, 'index']);
        Route::get('stock-alerts/statistics', [StockAlertController::class, 'statistics']);

        // Compliance Alerts - View Only
        // IMPORTANT: Specific routes (statistics, export/pdf) must come BEFORE {id} route to avoid route collision
        Route::get('compliance-alerts', [ComplianceAlertController::class, 'index']);
        Route::get('compliance-alerts/statistics', [ComplianceAlertController::class, 'statistics']);
        Route::get('compliance-alerts/export/pdf', [ComplianceAlertController::class, 'exportPDF']);
        Route::get('compliance-alerts/{id}', [ComplianceAlertController::class, 'show']);

        // Audit Logs - View Only
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('audit-logs/statistics', [AuditLogController::class, 'statistics']);
        Route::get('audit-logs/export/pdf', [AuditLogController::class, 'exportPDF']);

        // Reports & Analytics - View Only
        Route::get('reports/revenue', [ReportsController::class, 'revenue']);
        Route::get('reports/revenue/pdf', [ReportsController::class, 'generateRevenuePDF']);
        Route::get('reports/client-retention', [ReportsController::class, 'clientRetention']);
        Route::get('clients/analytics/pdf', [ReportsController::class, 'generateClientAnalyticsPDF']);
        Route::get('reports/staff-performance', [ReportsController::class, 'staffPerformance']);

        // Locations Management - View Only
        Route::get('locations', [LocationController::class, 'index']);
        Route::get('locations/{location}', [LocationController::class, 'show']);
        
    });

    /*
    |--------------------------------------------------------------------------
    | Staff (provider + reception) routes
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth:api', \App\Http\Middleware\StaffOnlyMiddleware::class])->prefix('staff')->group(function () {
        // Clients - Reception has full CRUD for client onboarding
        Route::get('clients', [ClientController::class, 'index']);
        Route::post('clients', [ClientController::class, 'store']);
        Route::get('clients/{client}', [ClientController::class, 'show']);
        Route::put('clients/{client}', [ClientController::class, 'update']);
        Route::delete('clients/{client}', [ClientController::class, 'destroy']);

        // Appointments - Reception has full CRUD, Provider view/update only
        Route::get('appointments', [AppointmentController::class, 'index']);
        Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);
        Route::patch('appointments/{appointment}/status', [AppointmentController::class, 'updateStatus']);
        Route::post('appointments', [AppointmentController::class, 'storeAppointmentByStaff']);
        Route::put('appointments/{appointment}', [AppointmentController::class, 'update']);
        Route::delete('appointments/{appointment}', [AppointmentController::class, 'destroy']);

        Route::apiResource('consent-forms', ConsentFormController::class);
        Route::apiResource('treatments', TreatmentController::class);

        // Payments - Reception can create payments for POS
        Route::get('payments', [PaymentController::class, 'index']);
        Route::post('payments', [PaymentController::class, 'store']);
        Route::get('payments/{payment}', [PaymentController::class, 'show']);
        Route::post('payments/{payment}/confirm-stripe', [PaymentController::class, 'confirmStripePayment']);
        Route::get('payments/{payment}/receipt', [PaymentController::class, 'generateReceipt']);

        Route::apiResource('packages', PackageController::class)->only(['index','show','store','update','destroy']);
        Route::post('packages/assign', [PackageController::class, 'assignToClient']);

        // ✅ Services: Staff can view
        Route::apiResource('services', ServiceController::class)->only(['index','show']);

        // ✅ Inventory: View only for all staff (no create/update/delete)
        // IMPORTANT: Specific routes (pdf) must come BEFORE {product} route to avoid route collision
        Route::get('products', [ProductController::class, 'index']);
        Route::get('products/pdf', [ProductController::class, 'generateInventoryPDF']);
        Route::get('products/{product}', [ProductController::class, 'show']);
        Route::get('stock-notifications', [StockNotificationController::class, 'index']);

        // ✅ Compliance Alerts - View only for providers
        // IMPORTANT: statistics route must come BEFORE {id} route to avoid route collision
        Route::get('compliance-alerts', [ComplianceAlertController::class, 'index']);
        Route::get('compliance-alerts/statistics', [ComplianceAlertController::class, 'statistics']);
        Route::get('compliance-alerts/{id}', [ComplianceAlertController::class, 'show']);
    });

    /*
    |--------------------------------------------------------------------------
    | Reception routes (strictly reception only)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth:api', \App\Http\Middleware\ReceptionOnlyMiddleware::class])->prefix('reception')->group(function () {
        // Clients
        Route::get('clients', [ClientController::class, 'index']);
        Route::post('clients', [ClientController::class, 'store']);
        Route::get('clients/{client}', [ClientController::class, 'show']);
        Route::put('clients/{client}', [ClientController::class, 'update']);
        Route::delete('clients/{client}', [ClientController::class, 'destroy']);

        // Appointments
        Route::get('appointments', [AppointmentController::class, 'index']);
        Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);
        Route::patch('appointments/{appointment}/status', [AppointmentController::class, 'updateStatus']);
        Route::post('appointments', [AppointmentController::class, 'storeAppointmentByStaff']);
        Route::put('appointments/{appointment}', [AppointmentController::class, 'update']);
        Route::delete('appointments/{appointment}', [AppointmentController::class, 'destroy']);

        // Payments
        Route::get('payments', [PaymentController::class, 'index']);
        Route::post('payments', [PaymentController::class, 'store']);
        Route::get('payments/{payment}', [PaymentController::class, 'show']);
        Route::post('payments/{payment}/confirm-stripe', [PaymentController::class, 'confirmStripePayment']);
        Route::get('payments/{payment}/receipt', [PaymentController::class, 'generateReceipt']);

        // Packages
        Route::apiResource('packages', PackageController::class)->only(['index','show','store','update','destroy']);
        Route::post('packages/assign', [PackageController::class, 'assignToClient']);

        // Services (read-only) and Products (read-only for POS)
        Route::apiResource('services', ServiceController::class)->only(['index','show']);
        Route::get('products', [ProductController::class, 'index']);
        Route::get('products/{product}', [ProductController::class, 'show']);
    });
    
    /*
    |--------------------------------------------------------------------------
    | Reception: Force Seed Data (Development/Testing Only)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth:api', \App\Http\Middleware\ReceptionOnlyMiddleware::class])->prefix('reception')->group(function () {
        Route::post('force-seed', function () {
            try {
                $seeded = \App\Http\Controllers\DatabaseSeederController::seedMissingData(true);
                
                // Verify counts
                $counts = [
                    'locations' => \App\Models\Location::count(),
                    'services' => \App\Models\Service::count(),
                    'products' => \App\Models\Product::count(),
                    'packages' => \App\Models\Package::count(),
                    'clients' => \App\Models\Client::count(),
                    'appointments' => \App\Models\Appointment::count(),
                    'payments' => \App\Models\Payment::count(),
                ];
                
                return response()->json([
                    'message' => 'Force seed completed successfully',
                    'seeded_tables' => $seeded,
                    'record_counts' => $counts,
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Force seed failed',
                    'error' => $e->getMessage(),
                ], 500);
            }
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Client routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('client')->middleware('auth:api')->group(function () {
        // Profile management
        Route::get('me/profile', [ProfileController::class, 'getProfile']);
        Route::put('me/profile', [ProfileController::class, 'updateProfile']);
        Route::post('me/profile/photo', [ProfileController::class, 'uploadProfilePhoto']);
        Route::delete('me/profile/photo', [ProfileController::class, 'deleteProfilePhoto']);

        // Appointments
        Route::get('appointments/form-data', [AppointmentController::class, 'formData']);
        Route::get('appointments', [AppointmentController::class, 'myAppointments']);
        Route::post('appointments', [AppointmentController::class, 'store']);
        Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);
        Route::put('appointments/{appointment}', [AppointmentController::class, 'update']);
        Route::patch('appointments/{appointment}/status', [AppointmentController::class, 'updateStatus']);
        Route::delete('appointments/{appointment}', [AppointmentController::class, 'destroy']);

        // Consent Forms
        Route::apiResource('consent-forms', ConsentFormController::class)->only([
            'index', 'store', 'show', 'update', 'destroy'
        ]);

        // Treatments (view own only)
        Route::apiResource('treatments', TreatmentController::class)->only([
            'index', 'show'
        ]);

        // Payments
        Route::get('payments', [PaymentController::class, 'myPayments']);
        Route::post('payments', [PaymentController::class, 'store']);
        Route::post('payments/{payment}/confirm-stripe', [PaymentController::class, 'confirmStripePayment']);
        Route::get('payments/{payment}/receipt', [PaymentController::class, 'generateReceipt']);

        // Packages
        Route::get('packages', [PackageController::class, 'myPackages']);
        
        // Services (view all available)
        Route::get('services', [ServiceController::class, 'index']);
        Route::get('services/{service}', [ServiceController::class, 'show']);
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
});
