<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\AuditLog;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use PDF; // barryvdh/laravel-dompdf
use App\Http\Controllers\DatabaseSeederController;

class PaymentController extends Controller
{
    public function __construct()
    {
        // Use config() instead of env() for cache compatibility
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    // List all payments (Admin/Provider/Reception)
    public function index()
    {
        try {
            $user = auth()->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }
            
            $query = Payment::with(['client.clientUser', 'appointment', 'package', 'paymentItems']);

            // Clients only see their own payments
            if ($user->role === 'client') {
                $client = Client::where('user_id', $user->id)->first();
                if ($client) {
                    $query->where('client_id', $client->id);
                } else {
                    return response()->json([]); // no client record
                }
            }

            $payments = $query->orderByDesc('created_at')->get();
            
            // Always eager load payment items to ensure they're included in response
            $payments->load('paymentItems');

            // Debug: Check database schema
            $schemaInfo = [
                'payments_table_exists' => Schema::hasTable('payments'),
                'payment_items_table_exists' => Schema::hasTable('payment_items'),
                'has_transaction_id_column' => Schema::hasColumn('payments', 'transaction_id'),
                'has_notes_column' => Schema::hasColumn('payments', 'notes'),
            ];

            \Log::info('Payment index - Found payments', [
                'count' => $payments->count(),
                'user_role' => $user->role,
                'user_id' => $user->id,
                'schema_info' => $schemaInfo,
            ]);

            // Check total payments in database (no filters)
            $totalPaymentsInDb = Payment::count();
            \Log::info('Total payments in database (unfiltered)', ['total' => $totalPaymentsInDb]);

            // Debug: Log first few payment IDs
            if ($payments->count() > 0) {
                \Log::info('Sample payment IDs', [
                    'ids' => $payments->take(3)->pluck('id')->toArray(),
                ]);
            } else {
                \Log::warning('No payments found in query', [
                    'total_in_db' => $totalPaymentsInDb,
                    'user_role' => $user->role,
                ]);
            }

            // If no data, check and seed all missing tables, then reload
            if ($payments->isEmpty()) {
                \Log::info('No payments found; checking if seeding is needed...');
                $seeded = DatabaseSeederController::seedMissingData();
                if (in_array('payments', $seeded) || !Payment::query()->exists()) {
                    \Illuminate\Support\Facades\Log::info('No payments found; seeding sample payments (auto)...');
                    $this->seedSamplePaymentsIfEmpty();
                    $payments = $query->orderByDesc('created_at')->get();
                    \Log::info('After seeding - payments count', ['count' => $payments->count()]);
                }
            }

            // Transform to a safe, consistent JSON structure to avoid serialization issues
            $result = $payments->map(function ($p) {
                try {
                    return [
                        'id' => $p->id ?? null,
                        'transaction_id' => $p->transaction_id ?? null,
                        'client_id' => $p->client_id ?? null,
                        'client' => $p->client ? [
                            'id' => $p->client->id ?? null,
                            'name' => $p->client->name ?? '',
                            'email' => optional($p->client->clientUser)->email ?? null,
                            'phone' => $p->client->phone ?? null,
                        ] : null,
                        'appointment_id' => $p->appointment_id ?? null,
                        'package_id' => $p->package_id ?? null,
                        'amount' => $p->amount ?? 0,
                        'payment_method' => $p->payment_method ?? 'cash',
                        'status' => $p->status ?? 'completed',
                        'tips' => $p->tips ?? 0,
                        'commission' => $p->commission ?? 0,
                        'stripe_payment_intent_id' => $p->stripe_payment_intent_id ?? null,
                        'notes' => $p->notes ?? null,
                        'paymentItems' => $p->paymentItems ? $p->paymentItems->map(function ($item) {
                            return [
                                'id' => $item->id ?? null,
                                'item_type' => $item->item_type ?? null,
                                'item_id' => $item->item_id ?? null,
                                'item_name' => $item->item_name ?? null,
                                'price' => $item->price ?? 0,
                                'quantity' => $item->quantity ?? 1,
                                'subtotal' => $item->subtotal ?? 0,
                            ];
                        })->toArray() : [],
                        'created_at' => $p->created_at ? $p->created_at->toDateTimeString() : null,
                        'updated_at' => $p->updated_at ? $p->updated_at->toDateTimeString() : null,
                    ];
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Payment transformation failed', [
                        'payment_id' => $p->id ?? 'unknown',
                        'error' => $e->getMessage(),
                    ]);
                    return null;
                }
            })->filter(); // Remove null entries

            return response()->json($result->values());
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Payment index failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Fail-open: return empty list instead of 500
            return response()->json([]);
        }
    }

    /**
     * Seed sample payments when table is empty (for testing/debugging).
     */
    private function seedSamplePaymentsIfEmpty(): void
    {
        try {
            if (Payment::query()->exists()) {
                return; // Data already exists
            }

            $client = Client::query()->first();
            if (!$client) {
                \Illuminate\Support\Facades\Log::warning('Skip seeding payments: missing client record');
                return;
            }

            // Create 2 sample payments
            Payment::create([
                'client_id' => $client->id,
                'appointment_id' => null,
                'package_id' => null,
                'amount' => 150.00,
                'payment_method' => 'cash',
                'status' => 'completed',
                'tips' => 20.00,
                'commission' => 30.00,
                'stripe_payment_intent_id' => null,
            ]);

            Payment::create([
                'client_id' => $client->id,
                'appointment_id' => null,
                'package_id' => null,
                'amount' => 250.00,
                'payment_method' => 'cash',
                'status' => 'completed',
                'tips' => 30.00,
                'commission' => 50.00,
                'stripe_payment_intent_id' => null,
            ]);

            \Illuminate\Support\Facades\Log::info('Seeded 2 sample payments for debug environment');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to seed sample payments', ['error' => $e->getMessage()]);
        }
    }

    // Client → view own payments
    public function myPayments()
    {
        try {
            $user = auth()->user();
            $client = Client::where('user_id', $user->id)->first();
            if (!$client) return response()->json(['message' => 'Client profile not found'], 404);

            $payments = Payment::with(['appointment','package','paymentItems'])->where('client_id', $client->id)->get();
            return response()->json($payments);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch client payments','error' => $e->getMessage()], 500);
        }
    }

    // Store a new payment (cash or Stripe)
    public function store(Request $request)
    {
        \Log::info('Payment store request received', [
            'user_id' => auth()->id(),
            'user_role' => auth()->user()?->role,
            'request_data' => $request->all(),
        ]);

        try {
            // Normalize payment_method: map 'card' to 'stripe' if received from frontend
            $paymentMethod = $request->payment_method;
            if ($paymentMethod === 'card') {
                $paymentMethod = 'stripe';
                $request->merge(['payment_method' => 'stripe']);
                \Log::info('Payment method normalized: card -> stripe');
            }
            
            $validated = $request->validate([
                'client_id'      => 'required|exists:clients,id',
                'appointment_id' => 'nullable|exists:appointments,id',
                'package_id'     => 'nullable|exists:packages,id',
                'amount'         => 'required|numeric|min:1',
                'payment_method' => 'required|in:stripe,cash',
                'tips'           => 'nullable|numeric',
                'status'         => 'required|in:pending,completed,canceled',
                'notes'          => 'nullable|string',
                'cart_items'     => 'nullable|array', // For POS payments: services/products
                'cart_items.*.id' => 'required|numeric',
                'cart_items.*.type' => 'required|in:service,product',
                'cart_items.*.name' => 'required|string',
                'cart_items.*.price' => 'required|numeric',
                'cart_items.*.quantity' => 'required|integer|min:1',
            ]);

            \Log::info('Payment validation passed', ['validated' => $validated]);

            $client = Client::find($request->client_id);
            if (!$client) {
                \Log::warning('Client not found', ['client_id' => $request->client_id]);
                return response()->json(['message'=>'Client not found','error'=>'Invalid client_id'],404);
            }

            // 🔹 Fixed Commission % Rule
            $commissionRate = config('medspa.commission_rate', 20); // default 20%
            $commission = ($request->amount * $commissionRate) / 100;

            // Generate unique transaction ID
            $transactionId = 'TXN-' . strtoupper(uniqid()) . '-' . time();

            if ($request->payment_method === 'stripe') {
                // Stripe payment - Use config() instead of env() for cache compatibility
                $stripeSecret = trim(config('services.stripe.secret'));
                if (!$stripeSecret) {
                    \Log::error('STRIPE_SECRET not configured');
                    return response()->json([
                        'message' => 'Stripe is not configured. Please set STRIPE_SECRET in .env',
                        'error' => 'STRIPE_SECRET missing'
                    ], 500);
                }

                // Verify key format
                if (!preg_match('/^sk_(test|live)_[a-zA-Z0-9]{24,}$/', $stripeSecret)) {
                    \Log::error('Invalid STRIPE_SECRET format', [
                        'key_length' => strlen($stripeSecret),
                        'key_preview' => substr($stripeSecret, 0, 20) . '...'
                    ]);
                    return response()->json([
                        'message' => 'Invalid Stripe API key format. Please check your STRIPE_SECRET in .env',
                        'error' => 'Invalid key format'
                    ], 500);
                }

                try {
                    Stripe::setApiKey($stripeSecret);
                    \Log::info('Creating Stripe PaymentIntent', [
                        'amount' => $request->amount,
                        'key_preview' => substr($stripeSecret, 0, 12) . '...'
                    ]);
                    
                $paymentIntent = PaymentIntent::create([
                    'amount' => $request->amount * 100,
                    'currency' => 'usd',
                    'payment_method_types' => ['card'],
                ]);

                    \Log::info('Stripe PaymentIntent created', ['payment_intent_id' => $paymentIntent->id]);
                } catch (\Stripe\Exception\AuthenticationException $e) {
                    \Log::error('Stripe authentication error', [
                        'error' => $e->getMessage(),
                        'stripe_error_type' => $e->getStripeCode(),
                        'http_status' => $e->getHttpStatus(),
                    ]);
                    return response()->json([
                        'message' => 'Stripe authentication failed. Please verify your STRIPE_SECRET key is valid and active in Stripe Dashboard.',
                        'error' => $e->getMessage(),
                        'help' => 'Check: https://dashboard.stripe.com/apikeys'
                    ], 500);
                } catch (\Stripe\Exception\ApiErrorException $e) {
                    \Log::error('Stripe API error', [
                        'error' => $e->getMessage(),
                        'stripe_error_type' => $e->getStripeCode(),
                        'http_status' => $e->getHttpStatus(),
                    ]);
                    return response()->json([
                        'message' => 'Stripe payment failed: ' . $e->getMessage(),
                        'error' => $e->getMessage()
                    ], 500);
                } catch (\Exception $e) {
                    \Log::error('Stripe initialization error', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    return response()->json([
                        'message' => 'Stripe payment initialization failed',
                        'error' => $e->getMessage()
                    ], 500);
                }

                try {
                    // Check if transaction_id column exists before using it
                    $paymentData = [
                    'client_id'      => $client->id,
                    'appointment_id' => $request->appointment_id,
                    'package_id'     => $request->package_id,
                    'amount'         => $request->amount,
                    'payment_method' => 'stripe',
                    'stripe_payment_intent_id' => $paymentIntent->id,
                    'status'         => 'pending',
                    'tips'           => $request->tips ?? 0,
                    'commission'     => $commission,
                    ];
                    
                    // Add transaction_id and notes if columns exist
                    if (\Illuminate\Support\Facades\Schema::hasColumn('payments', 'transaction_id')) {
                        $paymentData['transaction_id'] = $transactionId;
                    }
                    if (\Illuminate\Support\Facades\Schema::hasColumn('payments', 'notes')) {
                        $paymentData['notes'] = $request->notes;
                    }
                    
                    $payment = Payment::create($paymentData);

                    // Save payment items (services/products) if provided (POS payments)
                    if ($request->has('cart_items') && is_array($request->cart_items) && \Illuminate\Support\Facades\Schema::hasTable('payment_items')) {
                        foreach ($request->cart_items as $item) {
                            try {
                                \App\Models\PaymentItem::create([
                                    'payment_id' => $payment->id,
                                    'item_type'  => $item['type'],
                                    'item_id'    => $item['id'],
                                    'item_name'  => $item['name'],
                                    'price'      => $item['price'],
                                    'quantity'   => $item['quantity'],
                                    'subtotal'   => $item['price'] * $item['quantity'],
                                ]);
                            } catch (\Exception $e) {
                                \Log::warning('Failed to save payment item', [
                                    'payment_id' => $payment->id,
                                    'item' => $item,
                                    'error' => $e->getMessage()
                                ]);
                                // Continue with other items even if one fails
                            }
                        }
                    } else {
                        \Log::info('Payment items not saved for stripe payment', [
                            'has_cart_items' => $request->has('cart_items'),
                            'cart_items_is_array' => is_array($request->cart_items),
                            'payment_items_table_exists' => \Illuminate\Support\Facades\Schema::hasTable('payment_items')
                        ]);
                    }

                    // Comprehensive verification: Ensure payment was actually saved with all required data
                    $payment->refresh(); // Refresh from database
                    $savedPayment = Payment::find($payment->id);
                    
                    if (!$savedPayment) {
                        \Log::error('CRITICAL: Payment created but not found in database!', [
                            'payment_id' => $payment->id,
                        ]);
                        return response()->json([
                            'message' => 'Payment creation failed: Record not found in database',
                            'error' => 'Database verification failed'
                        ], 500);
                    }

                    // Verify all required fields are present
                    $verificationErrors = [];
                    if (!$savedPayment->client_id) {
                        $verificationErrors[] = 'Missing client_id';
                    }
                    if (!$savedPayment->amount || $savedPayment->amount <= 0) {
                        $verificationErrors[] = 'Invalid amount';
                    }
                    if (!$savedPayment->payment_method) {
                        $verificationErrors[] = 'Missing payment_method';
                    }
                    if (!$savedPayment->status) {
                        $verificationErrors[] = 'Missing status';
                    }
                    
                    // Verify transaction_id if column exists
                    if (Schema::hasColumn('payments', 'transaction_id')) {
                        if (!$savedPayment->transaction_id || $savedPayment->transaction_id === '') {
                            $verificationErrors[] = 'Missing transaction_id';
                        } else {
                            \Log::info('Transaction ID verified', [
                                'payment_id' => $payment->id,
                                'transaction_id' => $savedPayment->transaction_id,
                            ]);
                        }
                    }

                    if (!empty($verificationErrors)) {
                        \Log::error('Payment verification failed', [
                            'payment_id' => $payment->id,
                            'errors' => $verificationErrors,
                            'payment_data' => $savedPayment->toArray(),
                        ]);
                        return response()->json([
                            'message' => 'Payment created but verification failed',
                            'errors' => $verificationErrors,
                            'payment_id' => $payment->id,
                        ], 500);
                    }

                    // Verify payment items if cart_items were provided
                    $expectedItemsCount = 0;
                    if ($request->has('cart_items') && is_array($request->cart_items)) {
                        $expectedItemsCount = count($request->cart_items);
                        $actualItemsCount = $savedPayment->paymentItems()->count();
                        
                        if ($actualItemsCount !== $expectedItemsCount && Schema::hasTable('payment_items')) {
                            \Log::warning('Payment items count mismatch', [
                                'payment_id' => $payment->id,
                                'expected' => $expectedItemsCount,
                                'actual' => $actualItemsCount,
                            ]);
                            // Don't fail payment if items count is off, but log it
                        }
                    }

                    \Log::info('Payment record verified and validated', [
                        'payment_id' => $payment->id,
                        'transaction_id' => $savedPayment->transaction_id ?? 'NOT_SET',
                        'client_id' => $savedPayment->client_id,
                        'amount' => $savedPayment->amount,
                        'status' => $savedPayment->status,
                        'payment_method' => $savedPayment->payment_method,
                        'payment_items_count' => $savedPayment->paymentItems()->count(),
                        'expected_items_count' => $expectedItemsCount,
                        'created_at' => $savedPayment->created_at,
                        'all_fields_valid' => true,
                    ]);
                    
                    // Reload payment with all relationships for response
                    $payment = $savedPayment; // Use the verified payment
                    $payment->load(['client.clientUser', 'appointment', 'package', 'paymentItems']);
                } catch (\Illuminate\Database\QueryException $e) {
                    \Log::error('Database error creating payment', [
                        'error' => $e->getMessage(),
                        'sql_state' => $e->getCode(),
                        'sql' => $e->getSql() ?? 'N/A',
                        'bindings' => $e->getBindings() ?? [],
                    ]);
                    
                    // Check if it's a missing column error
                    $errorMessage = $e->getMessage();
                    if (str_contains($errorMessage, 'Unknown column') || str_contains($errorMessage, 'doesn\'t exist')) {
                        return response()->json([
                            'message' => 'Database schema issue detected. Please run migrations: php artisan migrate',
                            'error' => 'Missing database column or table',
                            'details' => $errorMessage
                        ], 500);
                    }
                    
                    return response()->json([
                        'message' => 'Failed to create payment record',
                        'error' => 'Database error: ' . $e->getMessage()
                    ], 500);
                }

                try {
                AuditLog::create([
                    'user_id'    => auth()->id(),
                    'action'     => 'create',
                    'table_name' => 'payments',
                    'record_id'  => $payment->id,
                    'new_data'   => json_encode($payment),
                ]);
                } catch (\Exception $e) {
                    \Log::warning('Failed to create audit log', ['error' => $e->getMessage()]);
                    // Don't fail the payment if audit log fails
                }

                // Ensure payment has all relationships loaded
                $payment->load(['client.clientUser','appointment','package','paymentItems']);
                
                // Build comprehensive response with verified data
                $paymentResponse = [
                    'id' => $payment->id,
                    'transaction_id' => $payment->transaction_id,
                    'client_id' => $payment->client_id,
                    'amount' => $payment->amount,
                    'payment_method' => $payment->payment_method,
                    'status' => $payment->status,
                    'tips' => $payment->tips,
                    'commission' => $payment->commission,
                    'created_at' => $payment->created_at,
                    'client' => $payment->client ? [
                        'id' => $payment->client->id,
                        'name' => $payment->client->name,
                        'email' => $payment->client->email ?? null,
                        'clientUser' => $payment->client->clientUser ? [
                            'id' => $payment->client->clientUser->id,
                            'name' => $payment->client->clientUser->name,
                        ] : null,
                    ] : null,
                    'appointment' => $payment->appointment,
                    'package' => $payment->package,
                    'payment_items' => $payment->paymentItems->map(function($item) {
                        return [
                            'id' => $item->id,
                            'item_type' => $item->item_type,
                            'item_id' => $item->item_id,
                            'item_name' => $item->item_name,
                            'price' => $item->price,
                            'quantity' => $item->quantity,
                            'subtotal' => $item->subtotal,
                        ];
                    }),
                    'payment_items_count' => $payment->paymentItems->count(),
                ];
                
                \Log::info('Stripe payment response prepared', [
                    'payment_id' => $payment->id,
                    'transaction_id' => $payment->transaction_id,
                    'has_payment_items' => $payment->paymentItems()->count() > 0,
                    'client_name' => $payment->client->name ?? 'N/A',
                    'response_includes_all_data' => true,
                ]);

                return response()->json([
                    'message' => 'Stripe payment initiated',
                    'client_secret' => $paymentIntent->client_secret,
                    'payment' => $paymentResponse,
                    'payment_id' => $payment->id, // Also include directly for easy access
                ], 201);

            } else {
                // Cash payment
                try {
                    // Check if transaction_id column exists before using it
                    $paymentData = [
                    'client_id'      => $client->id,
                    'appointment_id' => $request->appointment_id,
                    'package_id'     => $request->package_id,
                    'amount'         => $request->amount,
                    'payment_method' => 'cash',
                    'status'         => 'completed',
                    'tips'           => $request->tips ?? 0,
                    'commission'     => $commission,
                    ];
                    
                    // Add transaction_id and notes if columns exist
                    if (\Illuminate\Support\Facades\Schema::hasColumn('payments', 'transaction_id')) {
                        $paymentData['transaction_id'] = $transactionId;
                    }
                    if (\Illuminate\Support\Facades\Schema::hasColumn('payments', 'notes')) {
                        $paymentData['notes'] = $request->notes;
                    }
                    
                    $payment = Payment::create($paymentData);

                    // Save payment items (services/products) if provided (POS payments)
                    if ($request->has('cart_items') && is_array($request->cart_items) && \Illuminate\Support\Facades\Schema::hasTable('payment_items')) {
                        foreach ($request->cart_items as $item) {
                            try {
                                \App\Models\PaymentItem::create([
                                    'payment_id' => $payment->id,
                                    'item_type'  => $item['type'],
                                    'item_id'    => $item['id'],
                                    'item_name'  => $item['name'],
                                    'price'      => $item['price'],
                                    'quantity'   => $item['quantity'],
                                    'subtotal'   => $item['price'] * $item['quantity'],
                                ]);
                            } catch (\Exception $e) {
                                \Log::warning('Failed to save payment item', [
                                    'payment_id' => $payment->id,
                                    'item' => $item,
                                    'error' => $e->getMessage()
                                ]);
                                // Continue with other items even if one fails
                            }
                        }
                    } else {
                        \Log::info('Payment items not saved for cash payment', [
                            'has_cart_items' => $request->has('cart_items'),
                            'cart_items_is_array' => is_array($request->cart_items),
                            'payment_items_table_exists' => \Illuminate\Support\Facades\Schema::hasTable('payment_items')
                        ]);
                    }

                    // Comprehensive verification: Ensure payment was actually saved with all required data
                    $payment->refresh(); // Refresh from database
                    $savedPayment = Payment::find($payment->id);
                    
                    if (!$savedPayment) {
                        \Log::error('CRITICAL: Cash payment created but not found in database!', [
                            'payment_id' => $payment->id,
                        ]);
                        return response()->json([
                            'message' => 'Payment creation failed: Record not found in database',
                            'error' => 'Database verification failed'
                        ], 500);
                    }

                    // Verify all required fields are present
                    $verificationErrors = [];
                    if (!$savedPayment->client_id) {
                        $verificationErrors[] = 'Missing client_id';
                    }
                    if (!$savedPayment->amount || $savedPayment->amount <= 0) {
                        $verificationErrors[] = 'Invalid amount';
                    }
                    if (!$savedPayment->payment_method) {
                        $verificationErrors[] = 'Missing payment_method';
                    }
                    if (!$savedPayment->status) {
                        $verificationErrors[] = 'Missing status';
                    }
                    
                    // Verify transaction_id if column exists
                    if (Schema::hasColumn('payments', 'transaction_id')) {
                        if (!$savedPayment->transaction_id || $savedPayment->transaction_id === '') {
                            $verificationErrors[] = 'Missing transaction_id';
                        } else {
                            \Log::info('Cash payment transaction ID verified', [
                                'payment_id' => $payment->id,
                                'transaction_id' => $savedPayment->transaction_id,
                            ]);
                        }
                    }

                    if (!empty($verificationErrors)) {
                        \Log::error('Cash payment verification failed', [
                            'payment_id' => $payment->id,
                            'errors' => $verificationErrors,
                            'payment_data' => $savedPayment->toArray(),
                        ]);
                        return response()->json([
                            'message' => 'Payment created but verification failed',
                            'errors' => $verificationErrors,
                            'payment_id' => $payment->id,
                        ], 500);
                    }

                    // Verify payment items if cart_items were provided
                    $expectedItemsCount = 0;
                    if ($request->has('cart_items') && is_array($request->cart_items)) {
                        $expectedItemsCount = count($request->cart_items);
                        $actualItemsCount = $savedPayment->paymentItems()->count();
                        
                        if ($actualItemsCount !== $expectedItemsCount && Schema::hasTable('payment_items')) {
                            \Log::warning('Cash payment items count mismatch', [
                                'payment_id' => $payment->id,
                                'expected' => $expectedItemsCount,
                                'actual' => $actualItemsCount,
                            ]);
                            // Don't fail payment if items count is off, but log it
                        }
                    }

                    \Log::info('Cash payment verified and validated', [
                        'payment_id' => $payment->id,
                        'transaction_id' => $savedPayment->transaction_id ?? 'NOT_SET',
                        'client_id' => $savedPayment->client_id,
                        'amount' => $savedPayment->amount,
                        'status' => $savedPayment->status,
                        'payment_method' => $savedPayment->payment_method,
                        'payment_items_count' => $savedPayment->paymentItems()->count(),
                        'expected_items_count' => $expectedItemsCount,
                        'created_at' => $savedPayment->created_at,
                        'all_fields_valid' => true,
                    ]);
                    
                    // Reload payment with all relationships for response
                    $payment = $savedPayment; // Use the verified payment
                    $payment->load(['client.clientUser', 'appointment', 'package', 'paymentItems']);
                } catch (\Illuminate\Database\QueryException $e) {
                    \Log::error('Database error creating cash payment', [
                        'error' => $e->getMessage(),
                        'sql_state' => $e->getCode(),
                        'sql' => $e->getSql() ?? 'N/A',
                        'bindings' => $e->getBindings() ?? [],
                    ]);
                    
                    // Check if it's a missing column error
                    $errorMessage = $e->getMessage();
                    if (str_contains($errorMessage, 'Unknown column') || str_contains($errorMessage, 'doesn\'t exist')) {
                        return response()->json([
                            'message' => 'Database schema issue detected. Please run migrations: php artisan migrate',
                            'error' => 'Missing database column or table',
                            'details' => $errorMessage
                        ], 500);
                    }
                    
                    return response()->json([
                        'message' => 'Failed to create payment record',
                        'error' => 'Database error: ' . $e->getMessage()
                    ], 500);
                }

                try {
                AuditLog::create([
                    'user_id'    => auth()->id(),
                    'action'     => 'create',
                    'table_name' => 'payments',
                    'record_id'  => $payment->id,
                    'new_data'   => json_encode($payment),
                ]);
                } catch (\Exception $e) {
                    \Log::warning('Failed to create audit log', ['error' => $e->getMessage()]);
                    // Don't fail the payment if audit log fails
                }

                // Ensure payment has all relationships loaded
                $payment->load(['client.clientUser','appointment','package','paymentItems']);
                
                // Build comprehensive response with verified data
                $paymentResponse = [
                    'id' => $payment->id,
                    'transaction_id' => $payment->transaction_id,
                    'client_id' => $payment->client_id,
                    'amount' => $payment->amount,
                    'payment_method' => $payment->payment_method,
                    'status' => $payment->status,
                    'tips' => $payment->tips,
                    'commission' => $payment->commission,
                    'created_at' => $payment->created_at,
                    'client' => $payment->client ? [
                        'id' => $payment->client->id,
                        'name' => $payment->client->name,
                        'email' => $payment->client->email ?? null,
                        'clientUser' => $payment->client->clientUser ? [
                            'id' => $payment->client->clientUser->id,
                            'name' => $payment->client->clientUser->name,
                        ] : null,
                    ] : null,
                    'appointment' => $payment->appointment,
                    'package' => $payment->package,
                    'payment_items' => $payment->paymentItems->map(function($item) {
                        return [
                            'id' => $item->id,
                            'item_type' => $item->item_type,
                            'item_id' => $item->item_id,
                            'item_name' => $item->item_name,
                            'price' => $item->price,
                            'quantity' => $item->quantity,
                            'subtotal' => $item->subtotal,
                        ];
                    }),
                    'payment_items_count' => $payment->paymentItems->count(),
                ];
                
                \Log::info('Cash payment response prepared', [
                    'payment_id' => $payment->id,
                    'transaction_id' => $payment->transaction_id,
                    'has_payment_items' => $payment->paymentItems()->count() > 0,
                    'client_name' => $payment->client->name ?? 'N/A',
                    'response_includes_all_data' => true,
                ]);

                return response()->json([
                    'message' => 'Cash payment completed',
                    'payment' => $paymentResponse,
                    'payment_id' => $payment->id, // Also include directly for easy access
                ], 201);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('Payment validation failed', [
                'errors' => $e->errors(),
                'request_data' => $request->all(),
            ]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Payment store error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);
            return response()->json([
                'message' => 'Failed to create payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Confirm Stripe payment
    public function confirmStripePayment(Request $request, $paymentId)
    {
        try {
            $request->validate(['payment_intent_id'=>'required|string']);
            $payment = Payment::find($paymentId);
            if (!$payment || $payment->payment_method !== 'stripe') {
                return response()->json(['message'=>'Stripe payment not found'],404);
            }

            Stripe::setApiKey(config('services.stripe.secret'));
            $paymentIntent = PaymentIntent::retrieve($request->payment_intent_id);

            if ($paymentIntent->status === 'succeeded') {
                $payment->status = 'completed';
                $payment->save();

                // Reload payment with all relationships
                $payment->refresh();
                $payment->load(['client.clientUser','appointment','package','paymentItems']);

                \Log::info('Stripe payment confirmed', [
                    'payment_id' => $payment->id,
                    'transaction_id' => $payment->transaction_id,
                    'status' => $payment->status,
                    'has_payment_items' => $payment->paymentItems()->count() > 0,
                ]);

                try {
                AuditLog::create([
                    'user_id'=>auth()->id(),
                    'action'=>'update',
                    'table_name'=>'payments',
                    'record_id'=>$payment->id,
                    'new_data'=>json_encode($payment),
                ]);
                } catch (\Exception $e) {
                    \Log::warning('Failed to create audit log on payment confirmation', ['error' => $e->getMessage()]);
                }

                return response()->json([
                    'message'=>'Payment completed successfully',
                    'payment'=>$payment,
                    'payment_id' => $payment->id,
                ],200);
            } else {
                return response()->json(['message'=>'Payment not completed','status'=>$paymentIntent->status],400);
            }
        } catch (\Exception $e) {
            return response()->json(['message'=>'Failed to confirm Stripe payment','error'=>$e->getMessage()],500);
        }
    }

    // Generate Payment Receipt PDF
    public function generateReceipt($paymentId)
    {
        $payment = Payment::with(['client.clientUser', 'appointment', 'package', 'paymentItems'])->find($paymentId);

        if (!$payment) {
            return response()->json(['message'=>'Payment not found'],404);
        }

        $pdf = PDF::loadView('payments.receipt', compact('payment'));
        
        $filename = 'receipt-'.$payment->id.'.pdf';
        
        return $pdf->download($filename);
    }

    // 🔹 Other methods: show, update, destroy remain unchanged
}
