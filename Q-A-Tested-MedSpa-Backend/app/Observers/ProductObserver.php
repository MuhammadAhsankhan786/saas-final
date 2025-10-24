<?php

namespace App\Observers;

use App\Models\Product;
use App\Models\StockNotification;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class ProductObserver
{
    public function created(Product $product)
    {
        // Create audit log
        AuditLog::create([
            'user_id'    => Auth::id() ?? 1,
            'action'     => 'created',
            'table_name' => 'products',
            'record_id'  => $product->id,
            'old_data'   => null,
            'new_data'   => json_encode($product->getAttributes()),
        ]);

        // Check for low stock on creation
        $this->checkLowStock($product);
    }

    public function updated(Product $product)
    {
        // Create audit log
        $changes = $product->getChanges();
        AuditLog::create([
            'user_id'    => Auth::id() ?? 1,
            'action'     => 'updated',
            'table_name' => 'products',
            'record_id'  => $product->id,
            'old_data'   => json_encode($product->getOriginal()),
            'new_data'   => json_encode($changes),
        ]);

        // Check for low stock if stock was updated
        if ($product->isDirty('current_stock')) {
            $this->checkLowStock($product);
        }
    }

    public function deleted(Product $product)
    {
        // Create audit log
        AuditLog::create([
            'user_id'    => Auth::id() ?? 1,
            'action'     => 'deleted',
            'table_name' => 'products',
            'record_id'  => $product->id,
            'old_data'   => json_encode($product->getAttributes()),
            'new_data'   => null,
        ]);
    }

    /**
     * Check if product is low on stock and create notification.
     */
    private function checkLowStock(Product $product)
    {
        if ($product->current_stock <= $product->low_stock_threshold) {
            // Check if notification already exists for this product
            $existingNotification = StockNotification::where('product_id', $product->id)
                ->where('is_read', false)
                ->first();

            if (!$existingNotification) {
                StockNotification::create([
                    'product_id' => $product->id,
                    'current_stock' => $product->current_stock,
                    'is_read' => false,
                ]);
            }
        }
    }
}