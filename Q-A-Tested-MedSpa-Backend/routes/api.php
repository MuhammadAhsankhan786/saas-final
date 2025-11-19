<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
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
use App\Http\Controllers\ProviderDashboardController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\BusinessSettingsController;
use App\Http\Controllers\TwilioController;
use App\Http\Controllers\PasswordResetController;
use App\Services\StripeService;
/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

// Password Reset Routes (Public)
Route::post('auth/forgot-password', [PasswordResetController::class, 'sendResetLink']);
Route::post('auth/reset-password', [PasswordResetController::class, 'reset']);

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
        
        // 📋 Appointments - CRUD (MANAGE)
        Route::get('appointments', [AppointmentController::class, 'index']);
        Route::post('appointments', [AppointmentController::class, 'storeAppointmentByStaff']); // Admin can create
        Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);
        Route::put('appointments/{appointment}', [AppointmentController::class, 'update']);
        Route::delete('appointments/{appointment}', [AppointmentController::class, 'destroy']);
        Route::patch('appointments/{appointment}/status', [AppointmentController::class, 'updateStatus']);

        // 👥 Staff Management - CRUD (MANAGE)
        Route::apiResource('users', AdminUserController::class);
        Route::get('staff', [AdminUserController::class, 'index']); // Alias for clarity

        // ✅ Clients Management - View Only
        Route::get('clients', [ClientController::class, 'index']);
        Route::get('clients/{client}', [ClientController::class, 'show']);

        // 💰 Payments - View Only
        Route::get('payments', [PaymentController::class, 'index']);
        Route::get('payments/{payment}', [PaymentController::class, 'show']);
        Route::get('payments/{payment}/receipt', [PaymentController::class, 'generateReceipt']);

        // 📦 Packages - CRUD (MANAGE)
        // IMPORTANT: Specific routes (pdf) must come BEFORE apiResource to avoid route collision
        Route::get('packages/pdf', [PackageController::class, 'generatePackagesPDF']);
        Route::apiResource('packages', PackageController::class);
        Route::post('packages/assign', [PackageController::class, 'assignToClient']);

        // 🏥 Services - CRUD (MANAGE)
        Route::apiResource('services', ServiceController::class);

        // 📦 Inventory - CRUD (MANAGE)
        // IMPORTANT: Specific routes (pdf) must come BEFORE {product} route to avoid route collision
        Route::get('products', [ProductController::class, 'index']);
        Route::post('products', [ProductController::class, 'store']);
        Route::get('products/pdf', [ProductController::class, 'generateInventoryPDF']);
        Route::get('inventory/pdf', [ProductController::class, 'generateInventoryPDF']); // Alias for backward compatibility
        Route::get('products/{product}', [ProductController::class, 'show']);
        Route::put('products/{product}', [ProductController::class, 'update']);
        Route::delete('products/{product}', [ProductController::class, 'destroy']);
        Route::get('stock-notifications', [StockNotificationController::class, 'index']);
        
        // Stock Alerts - View Only
        Route::get('stock-alerts', [StockAlertController::class, 'index']);
        Route::get('stock-alerts/statistics', [StockAlertController::class, 'statistics']);

        // Compliance Alerts - View Only
        // IMPORTANT: Specific routes (statistics, export/pdf, dismiss, resolve) must come BEFORE {id} route to avoid route collision
        Route::get('compliance-alerts', [ComplianceAlertController::class, 'index']);
        Route::get('compliance-alerts/statistics', [ComplianceAlertController::class, 'statistics']);
        Route::get('compliance-alerts/export/pdf', [ComplianceAlertController::class, 'exportPDF']);
        Route::post('compliance-alerts/{id}/dismiss', [ComplianceAlertController::class, 'dismiss']);
        Route::post('compliance-alerts/{id}/resolve', [ComplianceAlertController::class, 'resolve']);
        Route::get('compliance-alerts/{id}', [ComplianceAlertController::class, 'show']);

        // Audit Logs - CRUD (MANAGE)
        // IMPORTANT: Specific routes (statistics, export/pdf) must come BEFORE {id} route to avoid route collision
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::post('audit-logs', [AuditLogController::class, 'store']);
        Route::get('audit-logs/statistics', [AuditLogController::class, 'statistics']);
        Route::get('audit-logs/export/pdf', [AuditLogController::class, 'exportPDF']);
        Route::get('audit-logs/{id}', [AuditLogController::class, 'show']);
        Route::put('audit-logs/{id}', [AuditLogController::class, 'update']);
        Route::delete('audit-logs/{id}', [AuditLogController::class, 'destroy']);

        // Reports & Analytics - View Only
        Route::get('reports/revenue', [ReportsController::class, 'revenue']);
        Route::get('reports/revenue/pdf', [ReportsController::class, 'generateRevenuePDF']);
        Route::get('reports/client-retention', [ReportsController::class, 'clientRetention']);
        Route::get('clients/analytics/pdf', [ReportsController::class, 'generateClientAnalyticsPDF']);
        Route::get('reports/staff-performance', [ReportsController::class, 'staffPerformance']);

        // Locations Management - CRUD (MANAGE)
        Route::apiResource('locations', LocationController::class);

        // 💳 Stripe - Revenue Analytics & Billing (Admin)
        Route::get('stripe/revenue', function (Request $request) {
            $stripeService = app(StripeService::class);
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $analytics = $stripeService->getRevenueAnalytics($startDate, $endDate);
            return response()->json($analytics);
        });
        Route::get('stripe/transactions', function (Request $request) {
            $stripeService = app(StripeService::class);
            $limit = $request->input('limit', 100);
            $startingAfter = $request->input('starting_after');
            $transactions = $stripeService->getTransactions($limit, $startingAfter);
            return response()->json($transactions);
        });
        Route::get('stripe/invoices', function (Request $request) {
            $stripeService = app(StripeService::class);
            $customerId = $request->input('customer_id');
            $limit = $request->input('limit', 100);
            $invoices = $stripeService->getInvoices($customerId, $limit);
            return response()->json($invoices);
        });

        // 📱 Twilio SMS - Marketing & System Alerts (Admin)
        Route::post('sms/marketing', [TwilioController::class, 'sendMarketingSms']);
        Route::post('sms/system-alert', [TwilioController::class, 'sendSystemAlert']);
        Route::get('sms/logs', [TwilioController::class, 'getSmsLogs']);
        
    });

    /*
    |--------------------------------------------------------------------------
    | Provider routes (provider only - restricted access)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth:api', \App\Http\Middleware\ProviderOnlyMiddleware::class])->prefix('provider')->group(function () {
        // 📊 Dashboard - Provider statistics
        Route::get('dashboard', [ProviderDashboardController::class, 'getStats']);

        // ✅ Own Appointments - View and update status only (no create/delete)
        Route::get('appointments', [AppointmentController::class, 'index']); // Filtered by provider_id in controller
        Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);
        Route::patch('appointments/{appointment}/status', [AppointmentController::class, 'updateStatus']);
        Route::put('appointments/{appointment}', [AppointmentController::class, 'update']); // Update own appointments only

        // ✅ Own Clients - View only (no create/update/delete)
        Route::get('clients', [ClientController::class, 'index']); // Filtered by appointments.provider_id in controller
        Route::get('clients/{client}', [ClientController::class, 'show']);

        // ✅ Treatments / SOAP - Full CRUD (own treatments only)
        Route::apiResource('treatments', TreatmentController::class);
        
        // ✅ Before/After Photos - Upload and manage (part of treatments)
        Route::post('treatments/{treatment}/photos', [TreatmentController::class, 'uploadPhotos']);
        Route::delete('treatments/{treatment}/photos/{type}', [TreatmentController::class, 'deletePhoto']);

        // ✅ Consent Forms - Full CRUD (assigned clients only)
        // IMPORTANT: Specific routes (pdf) must come BEFORE apiResource to avoid route collision
        Route::get('consent-forms/{id}/pdf', [ConsentFormController::class, 'downloadPDF']);
        Route::apiResource('consent-forms', ConsentFormController::class);

        // ✅ Inventory Usage - Log usage only (cannot edit stock directly)
        Route::get('inventory/products', [ProductController::class, 'index']); // View products
        Route::get('inventory/products/{product}', [ProductController::class, 'show']); // View product details
        Route::get('inventory/usage', [StockAdjustmentController::class, 'index']); // List usage logs (provider's own only)
        Route::post('inventory/usage', [StockAdjustmentController::class, 'logUsage']); // Log usage (remove type only)

        // 📱 Twilio SMS - Follow-up, Review Request, Post-Care (Provider)
        Route::post('sms/follow-up', [TwilioController::class, 'sendFollowUp']);
        Route::post('sms/review-request', [TwilioController::class, 'sendReviewRequest']);
        Route::post('sms/post-care', [TwilioController::class, 'sendPostCareInstructions']);
    });

    /*
    |--------------------------------------------------------------------------
    | Staff (reception only) routes
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

        // IMPORTANT: Specific routes (pdf) must come BEFORE apiResource to avoid route collision
        Route::get('consent-forms/{id}/pdf', [ConsentFormController::class, 'downloadPDF']);
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
        
        // Test endpoints for debugging (remove in production)
        Route::get('test-payment-status', [\App\Http\Controllers\TestPaymentController::class, 'getDatabaseStatus']);
        Route::post('test-payment-save', [\App\Http\Controllers\TestPaymentController::class, 'testPaymentSave']);

        // Packages
        Route::apiResource('packages', PackageController::class)->only(['index','show','store','update','destroy']);
        Route::post('packages/assign', [PackageController::class, 'assignToClient']);

        // Services (read-only) and Products (read-only for POS)
        Route::apiResource('services', ServiceController::class)->only(['index','show']);
        Route::get('products', [ProductController::class, 'index']);
        Route::get('products/{product}', [ProductController::class, 'show']);

        // 📱 Twilio SMS - Confirmation, Reminder, Reschedule, Cancellation, Welcome (Reception)
        Route::post('sms/confirmation', [TwilioController::class, 'sendConfirmation']);
        Route::post('sms/reminder', [TwilioController::class, 'sendReminder']);
        Route::post('sms/reschedule', [TwilioController::class, 'sendRescheduled']);
        Route::post('sms/cancellation', [TwilioController::class, 'sendCancellation']);
        Route::post('sms/welcome', [TwilioController::class, 'sendWelcome']);
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
        // IMPORTANT: Specific routes (pdf) must come BEFORE apiResource to avoid route collision
        Route::get('consent-forms/{id}/pdf', [ConsentFormController::class, 'downloadPDF']);
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
