<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf as PDF;

class ProductController extends Controller
{
    // List all products with location filtering
    public function index(Request $request)
    {
        $query = Product::with('location');

        // Filter by location if specified
        if ($request->has('location_id')) {
            $query->where('location_id', $request->location_id);
        }

        // Filter by category if specified
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Filter low stock items
        if ($request->has('low_stock') && $request->low_stock) {
            $query->whereRaw('current_stock <= low_stock_threshold');
        }

        return response()->json($query->get());
    }

    // Add new product
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:products',
            'category' => 'nullable|string|max:255',
            'price' => 'required|numeric',
            'current_stock' => 'required|integer|min:0',
            'minimum_stock' => 'required|integer|min:0',
            'low_stock_threshold' => 'required|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'expiry_date' => 'nullable|date|after:today',
            'lot_number' => 'nullable|string|max:255',
            'location_id' => 'required|exists:locations,id',
            'active' => 'boolean',
        ]);

        $product = Product::create($data);
        return response()->json($product, 201);
    }

    // Show single product
    public function show(Product $product)
    {
        return response()->json($product->load('location'));
    }

    // Update product
    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sku' => 'sometimes|string|unique:products,sku,' . $product->id,
            'category' => 'nullable|string|max:255',
            'price' => 'sometimes|numeric',
            'current_stock' => 'sometimes|integer|min:0',
            'minimum_stock' => 'sometimes|integer|min:0',
            'low_stock_threshold' => 'sometimes|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'expiry_date' => 'nullable|date',
            'lot_number' => 'nullable|string|max:255',
            'location_id' => 'sometimes|exists:locations,id',
            'active' => 'boolean',
        ]);

        $product->update($data);
        return response()->json($product);
    }

    // Delete product
    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(null, 204);
    }

    // Generate Inventory Report PDF
    public function generateInventoryPDF(Request $request)
    {
        // Get all products with location
        $products = Product::with('location')->get();
        
        // Calculate inventory statistics
        $totalProducts = $products->count();
        $activeProducts = $products->where('active', true)->count();
        $lowStockProducts = $products->where('current_stock', '<=', 'minimum_stock')->count();
        $totalValue = $products->sum(function($product) {
            return $product->current_stock * $product->price;
        });
        
        // Group by category
        $categoryBreakdown = $products->groupBy('category')->map(function($categoryProducts, $category) {
            return [
                'category' => $category ?: 'Uncategorized',
                'count' => $categoryProducts->count(),
                'total_value' => $categoryProducts->sum(function($product) {
                    return $product->current_stock * $product->price;
                }),
                'avg_price' => $categoryProducts->avg('price')
            ];
        })->sortByDesc('total_value');

        $pdf = PDF::loadView('inventory.report', compact(
            'products', 'totalProducts', 'activeProducts', 'lowStockProducts', 
            'totalValue', 'categoryBreakdown'
        ));
        
        return $pdf->download('inventory-report.pdf');
    }
}
