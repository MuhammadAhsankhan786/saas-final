<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\PaymentItem;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class TestPaymentController extends Controller
{
    /**
     * Test endpoint to verify payment creation and database saving
     */
    public function testPaymentSave(Request $request)
    {
        try {
            $client = Client::first();
            if (!$client) {
                return response()->json([
                    'error' => 'No clients found in database',
                    'message' => 'Please create a client first'
                ], 404);
            }

            // Check schema
            $schemaCheck = [
                'payments_table_exists' => Schema::hasTable('payments'),
                'payment_items_table_exists' => Schema::hasTable('payment_items'),
                'has_transaction_id' => Schema::hasColumn('payments', 'transaction_id'),
                'has_notes' => Schema::hasColumn('payments', 'notes'),
            ];

            // Create test payment
            $transactionId = 'TEST-' . strtoupper(uniqid()) . '-' . time();
            
            $paymentData = [
                'client_id' => $client->id,
                'amount' => 100.00,
                'payment_method' => 'cash',
                'status' => 'completed',
                'tips' => 10.00,
                'commission' => 20.00,
            ];

            if (Schema::hasColumn('payments', 'transaction_id')) {
                $paymentData['transaction_id'] = $transactionId;
            }
            if (Schema::hasColumn('payments', 'notes')) {
                $paymentData['notes'] = 'Test payment from verification endpoint';
            }

            $payment = Payment::create($paymentData);

            // Try to create test payment item
            $paymentItemCreated = false;
            if (Schema::hasTable('payment_items')) {
                try {
                    PaymentItem::create([
                        'payment_id' => $payment->id,
                        'item_type' => 'service',
                        'item_id' => 1,
                        'item_name' => 'Test Service',
                        'price' => 100.00,
                        'quantity' => 1,
                        'subtotal' => 100.00,
                    ]);
                    $paymentItemCreated = true;
                } catch (\Exception $e) {
                    \Log::warning('Test payment item creation failed', ['error' => $e->getMessage()]);
                }
            }

            // Verify payment exists
            $savedPayment = Payment::find($payment->id);
            $exists = $savedPayment !== null;

            // Check total payments
            $totalPayments = Payment::count();

            return response()->json([
                'success' => true,
                'message' => 'Test payment created',
                'schema_check' => $schemaCheck,
                'payment_created' => $exists,
                'payment_id' => $payment->id,
                'transaction_id' => $payment->transaction_id ?? 'NOT_SET',
                'payment_item_created' => $paymentItemCreated,
                'total_payments_in_db' => $totalPayments,
                'test_payment_data' => [
                    'id' => $savedPayment->id ?? null,
                    'amount' => $savedPayment->amount ?? null,
                    'client_id' => $savedPayment->client_id ?? null,
                    'status' => $savedPayment->status ?? null,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }
    }

    /**
     * Get database status
     */
    public function getDatabaseStatus()
    {
        $schemaCheck = [
            'payments_table_exists' => Schema::hasTable('payments'),
            'payment_items_table_exists' => Schema::hasTable('payment_items'),
            'has_transaction_id' => Schema::hasColumn('payments', 'transaction_id'),
            'has_notes' => Schema::hasColumn('payments', 'notes'),
        ];

        $paymentCount = 0;
        $paymentItemCount = 0;
        
        try {
            $paymentCount = Payment::count();
        } catch (\Exception $e) {
            // Table might not exist
        }

        try {
            $paymentItemCount = Schema::hasTable('payment_items') ? PaymentItem::count() : 0;
        } catch (\Exception $e) {
            // Table might not exist
        }

        return response()->json([
            'schema' => $schemaCheck,
            'counts' => [
                'payments' => $paymentCount,
                'payment_items' => $paymentItemCount,
            ],
        ], 200);
    }
}

