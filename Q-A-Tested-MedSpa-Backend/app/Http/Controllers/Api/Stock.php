<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockAdjustment;
use App\Models\StockNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StockAdjustmentController extends Controller
{
    public function store(Request $request, Product $product)
    {
        $request->validate([
            'quantity' => 'required|integer|not_in:0',
            'reason'   => 'nullable|string'
        ]);

        // ✅ Create adjustment record
        $adjustment = StockAdjustment::create([
            'product_id' => $product->id,
            'quantity'   => $request->quantity,
            'reason'     => $request->reason,
            'user_id'    => Auth::id() ?? 1,
        ]);

        // ✅ Update stock
        $product->stock += $request->quantity;
        $product->save();

        // ✅ Low stock check
        if ($product->stock < $product->minimum_stock) {
            StockNotification::firstOrCreate([
                'product_id' => $product->id,
                'message'    => "Low stock alert for {$product->name} (Stock: {$product->stock})",
            ]);
        }

        return response()->json([
            'message' => 'Stock adjusted successfully',
            'adjustment' => $adjustment,
            'product' => $product,
        ]);
    }
}
