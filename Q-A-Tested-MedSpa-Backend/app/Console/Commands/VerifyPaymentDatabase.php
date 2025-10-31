<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Payment;
use App\Models\PaymentItem;

class VerifyPaymentDatabase extends Command
{
    protected $signature = 'payments:verify-database';
    protected $description = 'Verify payments and payment_items tables exist and have correct schema';

    public function handle()
    {
        $this->info('🔍 Verifying Payment Database Schema...');
        $this->newLine();

        // Check payments table
        $this->info('Checking payments table...');
        if (!Schema::hasTable('payments')) {
            $this->error('❌ payments table does not exist!');
            $this->info('   Run: php artisan migrate');
            return 1;
        }
        $this->info('✅ payments table exists');

        // Check required columns in payments
        $requiredColumns = [
            'id', 'client_id', 'amount', 'payment_method', 'status', 
            'created_at', 'updated_at'
        ];
        $optionalColumns = ['transaction_id', 'notes', 'tips', 'commission'];
        
        $missingRequired = [];
        foreach ($requiredColumns as $col) {
            if (!Schema::hasColumn('payments', $col)) {
                $missingRequired[] = $col;
            }
        }
        
        if (!empty($missingRequired)) {
            $this->error('❌ Missing required columns: ' . implode(', ', $missingRequired));
            $this->info('   Run: php artisan migrate');
            return 1;
        }
        $this->info('✅ All required columns exist');
        
        // Check optional columns
        $missingOptional = [];
        foreach ($optionalColumns as $col) {
            if (!Schema::hasColumn('payments', $col)) {
                $missingOptional[] = $col;
            }
        }
        
        if (!empty($missingOptional)) {
            $this->warn('⚠️  Missing optional columns: ' . implode(', ', $missingOptional));
            $this->info('   Recommended: php artisan migrate');
        } else {
            $this->info('✅ All optional columns exist');
        }

        // Check payment_items table
        $this->newLine();
        $this->info('Checking payment_items table...');
        if (!Schema::hasTable('payment_items')) {
            $this->warn('⚠️  payment_items table does not exist!');
            $this->info('   POS payment items will not be saved.');
            $this->info('   Run: php artisan migrate');
        } else {
            $this->info('✅ payment_items table exists');
            
            $itemRequiredColumns = [
                'id', 'payment_id', 'item_type', 'item_id', 'item_name',
                'price', 'quantity', 'subtotal'
            ];
            
            $missingItemColumns = [];
            foreach ($itemRequiredColumns as $col) {
                if (!Schema::hasColumn('payment_items', $col)) {
                    $missingItemColumns[] = $col;
                }
            }
            
            if (!empty($missingItemColumns)) {
                $this->error('❌ Missing columns in payment_items: ' . implode(', ', $missingItemColumns));
                return 1;
            }
            $this->info('✅ All payment_items columns exist');
        }

        // Check data
        $this->newLine();
        $this->info('Checking existing payment data...');
        try {
            $paymentCount = Payment::count();
            $this->info("📊 Total payments in database: {$paymentCount}");
            
            if ($paymentCount > 0) {
                // Check recent payments
                $recentPayments = Payment::orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'transaction_id', 'client_id', 'amount', 'payment_method', 'status', 'created_at']);
                
                $this->info('Recent payments:');
                foreach ($recentPayments as $payment) {
                    $this->line("  - ID: {$payment->id}, Transaction: " . 
                        ($payment->transaction_id ?? 'N/A') . 
                        ", Amount: \${$payment->amount}, Method: {$payment->payment_method}, Status: {$payment->status}");
                }
                
                // Check payments with missing transaction_id
                if (Schema::hasColumn('payments', 'transaction_id')) {
                    $missingTransactionId = Payment::whereNull('transaction_id')
                        ->orWhere('transaction_id', '')
                        ->count();
                    if ($missingTransactionId > 0) {
                        $this->warn("⚠️  {$missingTransactionId} payments have missing transaction_id");
                    }
                }
            } else {
                $this->warn('⚠️  No payments found in database');
            }
            
            // Check payment items
            if (Schema::hasTable('payment_items')) {
                $itemCount = PaymentItem::count();
                $this->info("📦 Total payment items: {$itemCount}");
                
                if ($itemCount > 0) {
                    $paymentsWithItems = Payment::has('paymentItems')->count();
                    $this->info("💰 Payments with items: {$paymentsWithItems}");
                }
            }
            
        } catch (\Exception $e) {
            $this->error('Error checking payment data: ' . $e->getMessage());
            return 1;
        }

        $this->newLine();
        $this->info('✅ Database verification complete!');
        
        if (!empty($missingOptional) || !Schema::hasTable('payment_items')) {
            $this->newLine();
            $this->info('💡 Recommendation: Run migrations to ensure full functionality:');
            $this->info('   php artisan migrate');
        }
        
        return 0;
    }
}

