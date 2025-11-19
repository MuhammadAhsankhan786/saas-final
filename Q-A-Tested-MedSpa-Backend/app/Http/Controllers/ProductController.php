<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use App\Http\Controllers\DatabaseSeederController;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    // List all products with location filtering
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Product::with('location');

        // Provider can only VIEW products (read-only) - no filtering needed for viewing
        // They cannot manage products (add/delete/update stock) - only log usage
        // Admin/Reception can see all products

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

        $products = $query->get();
        
        // If no data, check and seed all missing tables, then reload
        if ($products->isEmpty()) {
            $seeded = DatabaseSeederController::seedMissingData();
            if (in_array('products', $seeded) || !Product::query()->exists()) {
                Log::info('No products found; data seeded automatically...');
                $products = $query->get();
            }
        }
        
        return response()->json($products);
    }

    // Add new product
    public function store(Request $request)
    {
        $user = auth()->user();
        
        // Provider cannot add products - they can only log usage
        if ($user && $user->role === 'provider') {
            return response()->json([
                'message' => 'Unauthorized - Providers can only log inventory usage, not manage products'
            ], 403);
        }
        
        try {
            $data = $request->validate([
                // Required fields
                'name' => 'required|string|max:255',
                'sku' => 'required|string|unique:products',
                'category' => 'required|string|max:255',
                'price' => 'required|numeric|min:0',
                'current_stock' => 'required|integer|min:0',
                'location_id' => 'required|exists:locations,id',
                
                // Optional fields
                'lot_number' => 'nullable|string|max:255',
                'expiry_date' => 'nullable|date',
                'low_stock_threshold' => 'nullable|integer|min:0',
            ], [
                // Required field messages
                'name.required' => 'Product name is required.',
                'sku.required' => 'SKU is required.',
                'sku.unique' => 'This SKU already exists. Please use a different SKU.',
                'category.required' => 'Category is required.',
                'price.required' => 'Price is required.',
                'price.numeric' => 'Price must be a valid number.',
                'price.min' => 'Price cannot be negative.',
                'current_stock.required' => 'Stock is required.',
                'current_stock.integer' => 'Stock must be a whole number.',
                'current_stock.min' => 'Stock cannot be negative.',
                'location_id.required' => 'Location is required.',
                'location_id.exists' => 'Selected location does not exist.',
                
                // Optional field messages
                'expiry_date.date' => 'Expiry date must be a valid date.',
                'low_stock_threshold.integer' => 'Low stock threshold must be a whole number.',
                'low_stock_threshold.min' => 'Low stock threshold cannot be negative.',
            ]);

            $product = Product::create($data);
            return response()->json(['success' => true, 'data' => $product], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed. Please check your input.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create product: ' . $e->getMessage()
            ], 500);
        }
    }

    // Show single product
    public function show(Product $product)
    {
        return response()->json($product->load('location'));
    }

    // Update product
    public function update(Request $request, Product $product)
    {
        $user = auth()->user();
        
        // Provider cannot update products - they can only log usage
        if ($user && $user->role === 'provider') {
            return response()->json([
                'message' => 'Unauthorized - Providers can only log inventory usage, not manage products'
            ], 403);
        }
        
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
        $user = auth()->user();
        
        // Provider cannot delete products - they can only log usage
        if ($user && $user->role === 'provider') {
            return response()->json([
                'message' => 'Unauthorized - Providers can only log inventory usage, not manage products'
            ], 403);
        }
        
        $product->delete();
        return response()->json(null, 204);
    }

    // Generate Inventory Report PDF
    public function generateInventoryPDF(Request $request)
    {
        try {
            // Get all products with location
            $products = Product::with('location')->get();
            
            // Calculate inventory statistics
            $totalProducts = $products->count();
            $activeProducts = $products->where('active', true)->count();
            // Use low_stock_threshold if available, otherwise use minimum_stock
            $lowStockProducts = $products->filter(function($product) {
                $threshold = $product->low_stock_threshold ?? $product->minimum_stock ?? 0;
                return $product->current_stock <= $threshold;
            })->count();
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
        } catch (\Exception $e) {
            Log::error('Failed to generate inventory PDF', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate PDF: ' . $e->getMessage()
            ], 500);
        }
    }
}
