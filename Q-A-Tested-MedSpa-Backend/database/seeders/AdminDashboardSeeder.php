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
        $admin = DB::table('users')->where('role', 'admin')->first();
        if (!$admin) {
            $adminId = DB::table('users')->insertGetId([
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => bcrypt('password'),
                'role' => 'admin',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        } else {
            $adminId = $admin->id;
        }

        // Get or create location
        $location = DB::table('locations')->first();
        if (!$location) {
            $locationId = DB::table('locations')->insertGetId([
                'name' => 'Main Location',
                'address' => '123 Main St',
                'city' => 'New York',
                'state' => 'NY',
                'zip_code' => '10001',
                'phone' => '(555) 123-4567',
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
        for ($i = 1; $i <= 15; $i++) {
            $clientId = $clientUserIds[array_rand($clientUserIds)];
            $startTime = Carbon::now()->addDays(rand(-30, 30))->setTime(rand(9, 17), rand(0, 59));
            $endTime = $startTime->copy()->addHour();
            
            DB::table('appointments')->insert([
                'client_id' => $clientId,
                'location_id' => $locationId,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'status' => ['booked', 'confirmed', 'completed', 'cancelled'][rand(0, 3)],
                'notes' => "Appointment #$i notes",
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }

        // Create payments (skip if payments table doesn't exist)
        try {
            $paymentMethods = ['cash', 'card', 'check'];
            for ($i = 1; $i <= 20; $i++) {
                DB::table('payments')->insert([
                    'client_id' => $clientUserIds[array_rand($clientUserIds)],
                    'amount' => rand(50, 500),
                    'payment_method' => $paymentMethods[rand(0, 2)],
                    'status' => ['completed', 'pending'][rand(0, 1)],
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
            
            $productId = DB::table('products')->insertGetId([
                'name' => "Product $i",
                'sku' => "SKU-$i",
                'category' => $categories[rand(0, 3)],
                'supplier' => "Supplier $i",
                'price' => rand(20, 200),
                'current_stock' => $currentStock,
                'min_stock' => $minStock,
                'location_id' => $locationId,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            // Create stock alerts if stock is low
            if ($currentStock < $minStock) {
                DB::table('stock_alerts')->insert([
                    'product_id' => $productId,
                    'product_name' => "Product $i",
                    'sku' => "SKU-$i",
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

        echo "✅ Sample data created successfully!\n";
        echo "   - 10 clients\n";
        echo "   - 15 appointments\n";
        echo "   - 20 payments\n";
        echo "   - 15 products\n";
        echo "   - Stock alerts for low-stock items\n";
    }
}

