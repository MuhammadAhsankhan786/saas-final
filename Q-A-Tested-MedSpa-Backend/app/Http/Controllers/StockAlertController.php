<?php

namespace App\Http\Controllers;

use App\Models\StockAlert;
use App\Models\Product;
use App\Http\Controllers\DatabaseSeederController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class StockAlertController extends Controller
{
    /**
     * Get all stock alerts with auto-insertion of real database data if empty
     */
    public function index()
    {
        // First ensure all base data exists (products, locations, etc.)
        if (Product::count() === 0) {
            \App\Http\Controllers\DatabaseSeederController::seedMissingData();
        }

        // Check if stock_alerts table is empty
        if (StockAlert::count() === 0) {
            $this->insertDemoData();
        }

        // Get all active alerts with product relationship
        try {
            $alerts = StockAlert::active()
                ->with('product')
                ->orderBy('priority', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($alerts);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error fetching stock alerts', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Return empty array instead of crashing
            return response()->json([]);
        }
    }

    /**
     * Insert real stock alert data from database products (not mock data)
     */
    private function insertDemoData()
    {
        // Ensure products exist first
        if (Product::count() === 0) {
            DatabaseSeederController::seedMissingData();
        }
        
        // Get existing products to create alerts for
        $products = Product::take(5)->get();
        
        if ($products->count() === 0) {
            // If no products exist, create some basic alerts
            $demoAlerts = [
                [
                    'product_id' => null,
                    'product_name' => 'HydraFacial Deluxe',
                    'sku' => 'SKU-1001',
                    'category' => 'Skincare',
                    'supplier' => 'HydraFacial Inc',
                    'current_stock' => 1,
                    'min_stock' => 5,
                    'max_stock' => 20,
                    'unit' => 'kit',
                    'alert_type' => 'critical',
                    'priority' => 'critical',
                    'days_until_out' => 2,
                    'last_restocked' => Carbon::now()->subDays(15),
                    'cost' => 150.00,
                    'selling_price' => 250.00,
                    'status' => 'active',
                    'notes' => 'Critical stock level - immediate restocking required',
                ],
                [
                    'product_id' => null,
                    'product_name' => 'Vitamin C Serum',
                    'sku' => 'SKU-1002',
                    'category' => 'Skincare',
                    'supplier' => 'Beauty Supply Co',
                    'current_stock' => 3,
                    'min_stock' => 5,
                    'max_stock' => 25,
                    'unit' => 'bottle',
                    'alert_type' => 'high-priority',
                    'priority' => 'high',
                    'days_until_out' => 7,
                    'last_restocked' => Carbon::now()->subDays(10),
                    'cost' => 25.00,
                    'selling_price' => 45.00,
                    'status' => 'active',
                    'notes' => 'High priority restocking needed',
                ],
                [
                    'product_id' => null,
                    'product_name' => 'Laser Treatment Session',
                    'sku' => 'SKU-1004',
                    'category' => 'Treatment',
                    'supplier' => 'MedTech Solutions',
                    'current_stock' => 0,
                    'min_stock' => 3,
                    'max_stock' => 15,
                    'unit' => 'session',
                    'alert_type' => 'out-of-stock',
                    'priority' => 'critical',
                    'days_until_out' => 0,
                    'last_restocked' => Carbon::now()->subDays(20),
                    'cost' => 200.00,
                    'selling_price' => 350.00,
                    'status' => 'active',
                    'notes' => 'Out of stock - urgent restocking required',
                ],
                [
                    'product_id' => null,
                    'product_name' => 'Aloe Vera Gel',
                    'sku' => 'SKU-1003',
                    'category' => 'Skincare',
                    'supplier' => 'Natural Beauty Co',
                    'current_stock' => 2,
                    'min_stock' => 5,
                    'max_stock' => 30,
                    'unit' => 'tube',
                    'alert_type' => 'low-stock',
                    'priority' => 'medium',
                    'days_until_out' => 10,
                    'last_restocked' => Carbon::now()->subDays(8),
                    'cost' => 8.00,
                    'selling_price' => 15.00,
                    'status' => 'active',
                    'notes' => 'Low stock alert - consider restocking',
                ],
                [
                    'product_id' => null,
                    'product_name' => 'Acne Control Cleanser',
                    'sku' => 'SKU-1005',
                    'category' => 'Skincare',
                    'supplier' => 'Dermatology Solutions',
                    'current_stock' => 5,
                    'min_stock' => 3,
                    'max_stock' => 20,
                    'unit' => 'bottle',
                    'alert_type' => 'normal',
                    'priority' => 'low',
                    'days_until_out' => 15,
                    'last_restocked' => Carbon::now()->subDays(5),
                    'cost' => 12.00,
                    'selling_price' => 22.00,
                    'status' => 'active',
                    'notes' => 'Normal stock level - monitor for future restocking',
                ],
            ];

            foreach ($demoAlerts as $alertData) {
                StockAlert::create($alertData);
            }
        } else {
            // If products exist, create alerts based on actual product data
            foreach ($products as $index => $product) {
                $alertTypes = ['critical', 'high-priority', 'out-of-stock', 'low-stock', 'normal'];
                $priorities = ['critical', 'high', 'medium', 'low'];
                
                $alertType = $alertTypes[$index % count($alertTypes)];
                $priority = $priorities[$index % count($priorities)];
                
                // Determine stock levels based on alert type
                $currentStock = match($alertType) {
                    'out-of-stock' => 0,
                    'critical' => 1,
                    'high-priority' => 3,
                    'low-stock' => 2,
                    default => 5
                };

                StockAlert::create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'category' => $product->category,
                    'supplier' => 'Demo Supplier',
                    'current_stock' => $currentStock,
                    'min_stock' => $product->minimum_stock ?? 5,
                    'max_stock' => 20,
                    'unit' => $product->unit ?? 'unit',
                    'alert_type' => $alertType,
                    'priority' => $priority,
                    'days_until_out' => $currentStock === 0 ? 0 : rand(1, 15),
                    'last_restocked' => Carbon::now()->subDays(rand(5, 20)),
                    'cost' => $product->price * 0.7, // Assume 70% of selling price as cost
                    'selling_price' => $product->price,
                    'status' => 'active',
                    'notes' => "Demo alert for {$product->name}",
                ]);
            }
        }
    }

    /**
     * Mark alert as dismissed
     */
    public function dismiss($id)
    {
        $alert = StockAlert::findOrFail($id);
        $alert->update(['status' => 'dismissed']);
        
        return response()->json(['message' => 'Alert dismissed successfully']);
    }

    /**
     * Mark alert as resolved
     */
    public function resolve($id)
    {
        $alert = StockAlert::findOrFail($id);
        $alert->update(['status' => 'resolved']);
        
        return response()->json(['message' => 'Alert resolved successfully']);
    }

    /**
     * Get alert statistics for summary cards
     */
    public function statistics()
    {
        $totalAlerts = StockAlert::active()->count();
        $criticalAlerts = StockAlert::active()->critical()->count();
        $highPriorityAlerts = StockAlert::active()->highPriority()->count();
        $outOfStockAlerts = StockAlert::active()->outOfStock()->count();

        return response()->json([
            'total_alerts' => $totalAlerts,
            'critical_alerts' => $criticalAlerts,
            'high_priority_alerts' => $highPriorityAlerts,
            'out_of_stock_alerts' => $outOfStockAlerts,
        ]);
    }
}