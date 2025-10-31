<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Payment;
use App\Models\PaymentItem;
use App\Models\Client;
use App\Models\Service;
use App\Models\Product;

class VerifyPOSPayments extends Command
{
    protected $signature = 'payments:verify-pos {--test-create : Create a test payment to verify saving}';
    protected $description = 'Comprehensive verification of POS payment save functionality';

    public function handle()
    {
        $this->info('🔍 POS Payment Verification Test');
        $this->info('================================');
        $this->newLine();

        // Step 1: Check Database Schema
        $this->info('Step 1: Checking Database Schema...');
        $schemaOk = $this->checkSchema();
        if (!$schemaOk) {
            $this->error('❌ Schema check failed. Please run migrations first.');
            return 1;
        }
        $this->newLine();

        // Step 2: Check Existing Payments
        $this->info('Step 2: Checking Existing Payments...');
        $this->checkExistingPayments();
        $this->newLine();

        // Step 3: Test Payment Creation (if flag is set)
        if ($this->option('test-create')) {
            $this->info('Step 3: Testing Payment Creation...');
            $this->testPaymentCreation();
            $this->newLine();
        }

        // Step 4: Verify Transaction ID Format
        $this->info('Step 4: Verifying Transaction ID Format...');
        $this->verifyTransactionIds();
        $this->newLine();

        // Step 5: Check Payment Items
        $this->info('Step 5: Checking Payment Items...');
        $this->checkPaymentItems();
        $this->newLine();

        $this->info('✅ Verification Complete!');
        return 0;
    }

    private function checkSchema(): bool
    {
        $issues = [];

        // Check payments table
        if (!Schema::hasTable('payments')) {
            $issues[] = 'payments table does not exist';
        } else {
            $this->info('  ✅ payments table exists');
            
            $requiredColumns = ['id', 'client_id', 'amount', 'payment_method', 'status', 'created_at'];
            foreach ($requiredColumns as $col) {
                if (!Schema::hasColumn('payments', $col)) {
                    $issues[] = "Missing required column: payments.{$col}";
                }
            }
            
            // Check optional columns
            if (!Schema::hasColumn('payments', 'transaction_id')) {
                $this->warn('  ⚠️  transaction_id column missing (run migration: 2025_01_27_000001)');
            } else {
                $this->info('  ✅ transaction_id column exists');
            }
            
            if (!Schema::hasColumn('payments', 'notes')) {
                $this->warn('  ⚠️  notes column missing (run migration: 2025_01_27_000001)');
            } else {
                $this->info('  ✅ notes column exists');
            }
        }

        // Check payment_items table
        if (!Schema::hasTable('payment_items')) {
            $this->warn('  ⚠️  payment_items table does not exist (run migration: 2025_01_27_000002)');
        } else {
            $this->info('  ✅ payment_items table exists');
            
            $itemColumns = ['id', 'payment_id', 'item_type', 'item_id', 'item_name', 'price', 'quantity', 'subtotal'];
            foreach ($itemColumns as $col) {
                if (!Schema::hasColumn('payment_items', $col)) {
                    $issues[] = "Missing column: payment_items.{$col}";
                }
            }
            
            if (empty($issues)) {
                $this->info('  ✅ All payment_items columns exist');
            }
        }

        if (!empty($issues)) {
            foreach ($issues as $issue) {
                $this->error("  ❌ {$issue}");
            }
            return false;
        }

        return true;
    }

    private function checkExistingPayments(): void
    {
        try {
            $totalPayments = Payment::count();
            $this->info("  📊 Total payments in database: {$totalPayments}");

            if ($totalPayments === 0) {
                $this->warn('  ⚠️  No payments found in database');
                return;
            }

            // Check recent payments
            $recentPayments = Payment::with('paymentItems')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            $this->info('  Recent payments:');
            foreach ($recentPayments as $payment) {
                $itemsCount = $payment->paymentItems->count();
                $transactionId = $payment->transaction_id ?? 'N/A';
                $this->line("    - ID: {$payment->id}, TXN: {$transactionId}, Amount: \${$payment->amount}, Method: {$payment->payment_method}, Items: {$itemsCount}");
            }

            // Check payments with missing transaction_id
            if (Schema::hasColumn('payments', 'transaction_id')) {
                $missingTxnId = Payment::whereNull('transaction_id')
                    ->orWhere('transaction_id', '')
                    ->count();
                
                if ($missingTxnId > 0) {
                    $this->warn("  ⚠️  {$missingTxnId} payments have missing transaction_id");
                } else {
                    $this->info('  ✅ All payments have transaction_id');
                }
            }

            // Check payment status distribution
            $statusCounts = Payment::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status');
            
            $this->info('  Payment status distribution:');
            foreach ($statusCounts as $status => $count) {
                $this->line("    - {$status}: {$count}");
            }

        } catch (\Exception $e) {
            $this->error("  ❌ Error checking payments: " . $e->getMessage());
        }
    }

    private function testPaymentCreation(): void
    {
        try {
            $client = Client::first();
            if (!$client) {
                $this->error('  ❌ No clients found. Cannot test payment creation.');
                return;
            }

            $this->info("  Creating test payment for client: {$client->name} (ID: {$client->id})");

            // Generate transaction ID (same format as PaymentController)
            $transactionId = 'TXN-' . strtoupper(uniqid()) . '-' . time();
            $this->info("  Generated transaction_id: {$transactionId}");

            // Create payment data
            $paymentData = [
                'client_id' => $client->id,
                'amount' => 150.00,
                'payment_method' => 'cash',
                'status' => 'completed',
                'tips' => 15.00,
                'commission' => 30.00,
            ];

            if (Schema::hasColumn('payments', 'transaction_id')) {
                $paymentData['transaction_id'] = $transactionId;
            }
            if (Schema::hasColumn('payments', 'notes')) {
                $paymentData['notes'] = 'Test payment created by verification command';
            }

            // Create payment
            $payment = Payment::create($paymentData);
            $this->info("  ✅ Payment created successfully (ID: {$payment->id})");

            // Verify payment exists
            $savedPayment = Payment::find($payment->id);
            if (!$savedPayment) {
                $this->error('  ❌ CRITICAL: Payment created but not found in database!');
                return;
            }

            // Verify transaction_id
            if ($savedPayment->transaction_id !== $transactionId) {
                $this->error("  ❌ Transaction ID mismatch! Expected: {$transactionId}, Got: {$savedPayment->transaction_id}");
            } else {
                $this->info("  ✅ Transaction ID matches: {$savedPayment->transaction_id}");
            }

            // Verify required fields
            $fields = ['client_id', 'amount', 'payment_method', 'status'];
            $allValid = true;
            foreach ($fields as $field) {
                if (empty($savedPayment->$field)) {
                    $this->error("  ❌ Missing required field: {$field}");
                    $allValid = false;
                }
            }

            if ($allValid) {
                $this->info('  ✅ All required fields are present and valid');
            }

            // Test payment items creation
            if (Schema::hasTable('payment_items')) {
                $this->info('  Testing payment items creation...');
                
                // Try to get a service or product
                $service = Service::first();
                $product = Product::first();
                
                if ($service || $product) {
                    $itemsCreated = 0;
                    
                    if ($service) {
                        PaymentItem::create([
                            'payment_id' => $payment->id,
                            'item_type' => 'service',
                            'item_id' => $service->id,
                            'item_name' => $service->name,
                            'price' => 100.00,
                            'quantity' => 1,
                            'subtotal' => 100.00,
                        ]);
                        $itemsCreated++;
                    }
                    
                    if ($product) {
                        PaymentItem::create([
                            'payment_id' => $payment->id,
                            'item_type' => 'product',
                            'item_id' => $product->id,
                            'item_name' => $product->name,
                            'price' => 50.00,
                            'quantity' => 1,
                            'subtotal' => 50.00,
                        ]);
                        $itemsCreated++;
                    }

                    if ($itemsCreated > 0) {
                        $actualItems = $payment->paymentItems()->count();
                        if ($actualItems === $itemsCreated) {
                            $this->info("  ✅ Payment items created successfully ({$actualItems} items)");
                        } else {
                            $this->warn("  ⚠️  Items count mismatch. Expected: {$itemsCreated}, Actual: {$actualItems}");
                        }
                    }
                } else {
                    $this->warn('  ⚠️  No services or products found. Skipping payment items test.');
                }
            }

            // Cleanup - delete test payment
            $this->info('  Cleaning up test payment...');
            $payment->paymentItems()->delete();
            $payment->delete();
            $this->info('  ✅ Test payment cleaned up');

        } catch (\Exception $e) {
            $this->error("  ❌ Error testing payment creation: " . $e->getMessage());
            $this->error("  Stack trace: " . $e->getTraceAsString());
        }
    }

    private function verifyTransactionIds(): void
    {
        try {
            if (!Schema::hasColumn('payments', 'transaction_id')) {
                $this->warn('  ⚠️  transaction_id column does not exist. Skipping verification.');
                return;
            }

            $paymentsWithTxnId = Payment::whereNotNull('transaction_id')
                ->where('transaction_id', '!=', '')
                ->get();

            if ($paymentsWithTxnId->isEmpty()) {
                $this->warn('  ⚠️  No payments with transaction_id found');
                return;
            }

            $this->info("  Checking {$paymentsWithTxnId->count()} payments with transaction_id...");

            $invalidFormat = 0;
            $validFormat = 0;

            foreach ($paymentsWithTxnId as $payment) {
                // Check if format matches: TXN-UUID-TIMESTAMP
                if (preg_match('/^TXN-[A-Z0-9]+-\d+$/', $payment->transaction_id)) {
                    $validFormat++;
                } else {
                    $invalidFormat++;
                    $this->warn("    ⚠️  Invalid format: {$payment->transaction_id}");
                }
            }

            $this->info("  ✅ Valid format: {$validFormat}");
            if ($invalidFormat > 0) {
                $this->warn("  ⚠️  Invalid format: {$invalidFormat}");
            }

        } catch (\Exception $e) {
            $this->error("  ❌ Error verifying transaction IDs: " . $e->getMessage());
        }
    }

    private function checkPaymentItems(): void
    {
        try {
            if (!Schema::hasTable('payment_items')) {
                $this->warn('  ⚠️  payment_items table does not exist');
                return;
            }

            $totalItems = PaymentItem::count();
            $this->info("  📦 Total payment items: {$totalItems}");

            if ($totalItems === 0) {
                $this->warn('  ⚠️  No payment items found');
                return;
            }

            // Check items by type
            $itemsByType = PaymentItem::select('item_type', DB::raw('count(*) as count'))
                ->groupBy('item_type')
                ->get()
                ->pluck('count', 'item_type');

            $this->info('  Items by type:');
            foreach ($itemsByType as $type => $count) {
                $this->line("    - {$type}: {$count}");
            }

            // Check items with missing data
            $missingData = PaymentItem::whereNull('item_name')
                ->orWhereNull('price')
                ->orWhereNull('quantity')
                ->count();

            if ($missingData > 0) {
                $this->warn("  ⚠️  {$missingData} items have missing data");
            } else {
                $this->info('  ✅ All items have complete data');
            }

            // Check payments with items
            $paymentsWithItems = Payment::has('paymentItems')->count();
            $this->info("  💰 Payments with items: {$paymentsWithItems}");

            // Sample items
            $sampleItems = PaymentItem::with('payment')
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();

            if ($sampleItems->isNotEmpty()) {
                $this->info('  Sample payment items:');
                foreach ($sampleItems as $item) {
                    $this->line("    - Payment #{$item->payment_id}: {$item->item_name} ({$item->item_type}), Qty: {$item->quantity}, Subtotal: \${$item->subtotal}");
                }
            }

        } catch (\Exception $e) {
            $this->error("  ❌ Error checking payment items: " . $e->getMessage());
        }
    }
}

