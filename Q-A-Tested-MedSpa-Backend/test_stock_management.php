<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Product;
use App\Models\StockAdjustment;
use App\Models\StockNotification;

echo "🧪 Testing Stock Management System...\n\n";

try {
    // 1. Test Product Creation
    echo "1️⃣ Testing Product Creation...\n";
    $product = Product::create([
        'name' => 'Test Product',
        'sku' => 'TEST-001',
        'price' => 25.50,
        'current_stock' => 100,
        'minimum_stock' => 10,
        'unit' => 'pcs',
        'active' => true
    ]);
    
    echo "✅ Product created successfully with ID: {$product->id}\n";
    echo "   - Name: {$product->name}\n";
    echo "   - Price: \${$product->price}\n";
    echo "   - Current Stock: {$product->current_stock}\n";
    echo "   - Minimum Stock: {$product->minimum_stock}\n\n";
    
    // 2. Test Stock Decrease
    echo "2️⃣ Testing Stock Decrease...\n";
    $product->decrement('current_stock', 5);
    $product->refresh();
    echo "✅ Stock decreased by 5. New stock: {$product->current_stock}\n\n";
    
    // 3. Test StockAdjustment Creation
    echo "3️⃣ Testing StockAdjustment Creation...\n";
    $adjustment = StockAdjustment::create([
        'product_id' => $product->id,
        'change' => -10,
        'previous_stock' => $product->current_stock,
        'new_stock' => $product->current_stock - 10,
        'user_id' => 1,
        'reason' => 'Test adjustment'
    ]);
    
    echo "✅ StockAdjustment created successfully with ID: {$adjustment->id}\n";
    echo "   - Change: {$adjustment->change}\n";
    echo "   - Previous Stock: {$adjustment->previous_stock}\n";
    echo "   - New Stock: {$adjustment->new_stock}\n\n";
    
    // 4. Test StockNotification Creation
    echo "4️⃣ Testing StockNotification Creation...\n";
    $notification = StockNotification::create([
        'product_id' => $product->id,
        'current_stock' => $product->current_stock,
        'is_read' => false
    ]);
    
    echo "✅ StockNotification created successfully with ID: {$notification->id}\n";
    echo "   - Current Stock: {$notification->current_stock}\n";
    echo "   - Is Read: " . ($notification->is_read ? 'Yes' : 'No') . "\n\n";
    
    echo "🎉 All stock management tests passed successfully!\n";
    echo "✅ Product creation: FIXED\n";
    echo "✅ Stock decrease: FIXED\n";
    echo "✅ StockAdjustment creation: FIXED\n";
    echo "✅ StockNotification creation: FIXED\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Error Code: " . $e->getCode() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

