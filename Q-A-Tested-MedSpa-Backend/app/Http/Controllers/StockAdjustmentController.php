<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockAdjustment;
use Illuminate\Http\Request;

class StockAdjustmentController extends Controller
{
    /**
     * Store a newly created stock adjustment.
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'adjustment_type' => 'required|in:add,remove,set',
            'quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $product = Product::findOrFail($request->product_id);
        
        // Calculate new stock based on adjustment type
        $currentStock = $product->current_stock;
        $adjustmentQuantity = $request->quantity;
        
        switch ($request->adjustment_type) {
            case 'add':
                $newStock = $currentStock + $adjustmentQuantity;
                break;
            case 'remove':
                $newStock = max(0, $currentStock - $adjustmentQuantity);
                break;
            case 'set':
                $newStock = $adjustmentQuantity;
                break;
        }

        // Update product stock
        $product->update(['current_stock' => $newStock]);

        // Create stock adjustment record
        $adjustment = StockAdjustment::create([
            'product_id' => $request->product_id,
            'adjustment_type' => $request->adjustment_type,
            'quantity' => $adjustmentQuantity,
            'previous_stock' => $currentStock,
            'new_stock' => $newStock,
            'reason' => $request->reason,
            'notes' => $request->notes,
            'adjusted_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Stock adjustment created successfully',
            'adjustment' => $adjustment,
            'product' => $product->fresh()
        ], 201);
    }
}

