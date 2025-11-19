<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminDashboardSeeder extends Seeder
{
    public function run()
    {
        // Clear existing data (optional - comment out if you want to keep existing data)
        // DB::table('appointments')->delete();
        // DB::table('payments')->delete();
        // DB::table('clients')->delete();
        // DB::table('products')->delete();
        
        // Get or create admin user
        // Ensure canonical admin account
        $existingAdmin = DB::table('users')->where('email', 'admin@pulse.com')->first();
        if ($existingAdmin) {
            $adminId = $existingAdmin->id;
        } else {
            $adminId = DB::table('users')->updateOrInsert(
                ['email' => 'admin@pulse.com'],
                [
                    'name' => 'Admin User',
                    'password' => bcrypt('admin123'),
                    'role' => 'admin',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]
            );
            // updateOrInsert returns boolean in some DBs; re-read id
            $adminId = DB::table('users')->where('email', 'admin@pulse.com')->value('id');
        }

        // Get or create location
        $location = DB::table('locations')->first();
        if (!$location) {
            $locationId = DB::table('locations')->insertGetId([
                'name' => 'Main Location',
                'address' => '123 Main St',
                'city' => 'New York',
                'state' => 'NY',
                'zip' => '10001',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        } else {
            $locationId = $location->id;
        }

        // Create clients
        $clientUserIds = [];
        for ($i = 1; $i <= 10; $i++) {
            // Check if user already exists
            $existingUser = DB::table('users')->where('email', "client$i@example.com")->first();
            
            if ($existingUser) {
                $clientUserId = $existingUser->id;
            } else {
                $clientUserId = DB::table('users')->insertGetId([
                    'name' => "Client $i",
                    'email' => "client$i@example.com",
                    'password' => bcrypt('password'),
                    'role' => 'client',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }
            
            // Check if client already exists
            $existingClient = DB::table('clients')->where('user_id', $clientUserId)->first();
            
            if ($existingClient) {
                $clientId = $existingClient->id;
            } else {
                $clientId = DB::table('clients')->insertGetId([
                    'user_id' => $clientUserId,
                    'name' => "Client $i",
                    'email' => "client$i@example.com",
                    'phone' => "+1234567890$i",
                    'location_id' => $locationId,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }
            
            $clientUserIds[] = $clientId;
        }

        // Create appointments
        // Get a provider user for appointments
        $provider = DB::table('users')->where('role', 'provider')->first();
        if (!$provider) {
            $providerId = DB::table('users')->insertGetId([
                'name' => 'Provider User',
                'email' => 'provider@pulse.com',
                'password' => bcrypt('provider123'),
                'role' => 'provider',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        } else {
            $providerId = $provider->id;
        }
        
        // Get a service
        $service = DB::table('services')->first();
        if (!$service) {
            $serviceId = DB::table('services')->insertGetId([
                'category' => 'Facial',
                'name' => 'Basic Service',
                'price' => 100.00,
                'description' => 'Basic service',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        } else {
            $serviceId = $service->id;
        }
        
        for ($i = 1; $i <= 15; $i++) {
            $clientId = $clientUserIds[array_rand($clientUserIds)];
            $startTime = Carbon::now()->addDays(rand(-30, 30))->setTime(rand(9, 17), rand(0, 59));
            $endTime = $startTime->copy()->addHours(1);
            
            DB::table('appointments')->insert([
                'client_id' => $clientId,
                'location_id' => $locationId,
                'provider_id' => $providerId,
                'service_id' => $serviceId,
                'appointment_time' => $startTime,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'status' => ['booked', 'completed', 'canceled'][rand(0, 2)],
                'notes' => "Appointment #$i notes",
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }

        // Create payments (skip if payments table doesn't exist)
        try {
            $paymentMethods = ['cash', 'stripe'];
            for ($i = 1; $i <= 20; $i++) {
                DB::table('payments')->insert([
                    'client_id' => $clientUserIds[array_rand($clientUserIds)],
                    'amount' => rand(50, 500),
                    'payment_method' => $paymentMethods[rand(0, 1)],
                    'status' => 'completed',
                    'tips' => rand(0, 50),
                    'commission' => rand(10, 100),
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }
        } catch (\Exception $e) {
            echo "⚠️ Payments table issue: " . $e->getMessage() . "\n";
        }

        // Create products
        $categories = ['Skincare', 'Injectables', 'Devices', 'Supplements'];
        for ($i = 1; $i <= 15; $i++) {
            $currentStock = rand(0, 100);
            $minStock = 10;
            $sku = "SKU-$i";
            
            // Check if product already exists
            $existingProduct = DB::table('products')->where('sku', $sku)->first();
            if ($existingProduct) {
                $productId = $existingProduct->id;
                $currentStock = $existingProduct->current_stock ?? $currentStock;
            } else {
                $productId = DB::table('products')->insertGetId([
                    'name' => "Product $i",
                    'sku' => $sku,
                    'category' => $categories[rand(0, 3)],
                    'price' => rand(20, 200),
                    'current_stock' => $currentStock,
                    'minimum_stock' => $minStock,
                    'location_id' => $locationId,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }

            // Create stock alerts if stock is low (only if alert doesn't already exist)
            if ($currentStock < $minStock) {
                $existingAlert = DB::table('stock_alerts')
                    ->where('product_id', $productId)
                    ->where('status', 'active')
                    ->first();
                    
                if (!$existingAlert) {
                    DB::table('stock_alerts')->insert([
                        'product_id' => $productId,
                        'product_name' => "Product $i",
                        'sku' => $sku,
                        'category' => $categories[rand(0, 3)],
                        'supplier' => "Supplier $i",
                        'current_stock' => $currentStock,
                        'min_stock' => $minStock,
                        'alert_type' => 'low-stock',
                        'priority' => $currentStock < 5 ? 'critical' : 'high',
                        'status' => 'active',
                        'created_at' => Carbon::now(),
                        'updated_at' => Carbon::now(),
                    ]);
                }
            }
        }

        echo "✅ Sample data created successfully!\n";
        echo "   - 10 clients\n";
        echo "   - 15 appointments\n";
        echo "   - 20 payments\n";
        echo "   - 15 products\n";
        echo "   - Stock alerts for low-stock items\n";
    }
}

