<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class CheckPaymentSchema extends Command
{
    protected $signature = 'payments:check-schema';
    protected $description = 'Check if payments table and payment_items table have required columns';

    public function handle()
    {
        $this->info('Checking Payment Schema...');
        
        // Check payments table
        if (!Schema::hasTable('payments')) {
            $this->error('❌ payments table does not exist!');
            $this->info('Run: php artisan migrate');
            return 1;
        }
        
        $this->info('✅ payments table exists');
        
        // Check required columns
        $requiredColumns = ['id', 'client_id', 'amount', 'payment_method', 'status', 'created_at'];
        $missingColumns = [];
        
        foreach ($requiredColumns as $column) {
            if (!Schema::hasColumn('payments', $column)) {
                $missingColumns[] = $column;
            }
        }
        
        if (!empty($missingColumns)) {
            $this->error('❌ Missing columns in payments table: ' . implode(', ', $missingColumns));
        } else {
            $this->info('✅ All required columns exist in payments table');
        }
        
        // Check optional columns
        if (Schema::hasColumn('payments', 'transaction_id')) {
            $this->info('✅ transaction_id column exists');
        } else {
            $this->warn('⚠️  transaction_id column missing (run migration: 2025_01_27_000001_add_transaction_id_to_payments_table.php)');
        }
        
        if (Schema::hasColumn('payments', 'notes')) {
            $this->info('✅ notes column exists');
        } else {
            $this->warn('⚠️  notes column missing (run migration: 2025_01_27_000001_add_transaction_id_to_payments_table.php)');
        }
        
        // Check payment_items table
        if (Schema::hasTable('payment_items')) {
            $this->info('✅ payment_items table exists');
            
            $requiredItemColumns = ['id', 'payment_id', 'item_type', 'item_id', 'item_name', 'price', 'quantity', 'subtotal'];
            $missingItemColumns = [];
            
            foreach ($requiredItemColumns as $column) {
                if (!Schema::hasColumn('payment_items', $column)) {
                    $missingItemColumns[] = $column;
                }
            }
            
            if (!empty($missingItemColumns)) {
                $this->error('❌ Missing columns in payment_items table: ' . implode(', ', $missingItemColumns));
            } else {
                $this->info('✅ All required columns exist in payment_items table');
            }
        } else {
            $this->warn('⚠️  payment_items table missing (run migration: 2025_01_27_000002_create_payment_items_table.php)');
        }
        
        // Check current payment count
        try {
            $paymentCount = DB::table('payments')->count();
            $this->info("📊 Current payments in database: {$paymentCount}");
            
            if ($paymentCount > 0) {
                $latestPayment = DB::table('payments')->latest('created_at')->first();
                $this->info("📅 Latest payment: ID {$latestPayment->id}, Amount: \${$latestPayment->amount}, Created: {$latestPayment->created_at}");
            }
        } catch (\Exception $e) {
            $this->error('Error checking payment count: ' . $e->getMessage());
        }
        
        return 0;
    }
}

