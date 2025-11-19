<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockAdjustment;
use Illuminate\Http\Request;

class StockAdjustmentController extends Controller
{
    /**
     * Display a listing of inventory usage logs.
     * Provider sees only their own usage logs.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = StockAdjustment::with(['product', 'adjustedBy'])
            ->where('adjustment_type', 'remove'); // Only show usage logs (remove type)

        // Provider can only see their own usage logs
        if ($user && $user->role === 'provider') {
            $query->where('adjusted_by', $user->id);
        }
        // Admin can see all usage logs

        // Filter by product if specified
        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        // Filter by date range if specified
        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $usageLogs = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'usage_logs' => $usageLogs,
            'total' => $usageLogs->count()
        ], 200);
    }

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

    /**
     * Log inventory usage (Provider only - can only remove/use, not add or set)
     */
    public function logUsage(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $user = auth()->user();
        
        if (!$user || $user->role !== 'provider') {
            return response()->json([
                'message' => 'Unauthorized. Provider access only.'
            ], 403);
        }

        $product = Product::findOrFail($request->product_id);
        $currentStock = $product->current_stock;
        $usageQuantity = $request->quantity;

        // Provider can only log usage (remove), not add or set stock
        if ($usageQuantity > $currentStock) {
            return response()->json([
                'message' => 'Insufficient stock. Available: ' . $currentStock,
                'error' => 'insufficient_stock'
            ], 422);
        }

        $newStock = max(0, $currentStock - $usageQuantity);

        // Update product stock
        $product->update(['current_stock' => $newStock]);

        // Create stock adjustment record (usage log)
        $adjustment = StockAdjustment::create([
            'product_id' => $request->product_id,
            'adjustment_type' => 'remove', // Provider can only log usage (remove)
            'quantity' => $usageQuantity,
            'previous_stock' => $currentStock,
            'new_stock' => $newStock,
            'reason' => $request->reason ?? 'Inventory usage logged by provider',
            'notes' => $request->notes,
            'adjusted_by' => $user->id,
        ]);

        return response()->json([
            'message' => 'Inventory usage logged successfully',
            'adjustment' => $adjustment,
            'product' => $product->fresh()
        ], 201);
    }
}

