<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ClientDataSeeder extends Seeder
{
    public function run()
    {
        echo "🌱 Seeding client-specific data...\n";

        // Find or create a client user
        $clientUser = DB::table('users')->where('role', 'client')->first();
        
        if (!$clientUser) {
            echo "⚠️ No client user found. Creating one...\n";
            $clientUserId = DB::table('users')->insertGetId([
                'name' => 'Test Client',
                'email' => 'client@example.com',
                'password' => bcrypt('password'),
                'role' => 'client',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        } else {
            $clientUserId = $clientUser->id;
        }

        // Find or create client profile
        $client = DB::table('clients')->where('user_id', $clientUserId)->first();
        
        if (!$client) {
            echo "Creating client profile...\n";
            // Get location
            $location = DB::table('locations')->first();
            if (!$location) {
                $locationId = DB::table('locations')->insertGetId([
                    'name' => 'Main MedSpa',
                    'address' => '123 Wellness Ave',
                    'city' => 'New York',
                    'state' => 'NY',
                    'zip' => '10001',
                    'timezone' => 'America/New_York',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            } else {
                $locationId = $location->id;
            }

            $clientId = DB::table('clients')->insertGetId([
                'user_id' => $clientUserId,
                'name' => 'Test Client',
                'email' => 'client@example.com',
                'phone' => '+1234567890',
                'location_id' => $locationId,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        } else {
            $clientId = $client->id;
            $locationId = $client->location_id;
        }

        echo "Client ID: $clientId\n";

        // Create 3 appointments (past + upcoming)
        $appointmentCount = DB::table('appointments')->where('client_id', $clientId)->count();
        if ($appointmentCount < 3) {
            echo "Creating appointments...\n";
            
            // Past appointment
            DB::table('appointments')->insert([
                'client_id' => $clientId,
                'location_id' => $locationId,
                'start_time' => Carbon::now()->subDays(5)->setTime(10, 0),
                'end_time' => Carbon::now()->subDays(5)->setTime(11, 0),
                'status' => 'completed',
                'notes' => 'Completed facial treatment',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            // Today's appointment
            DB::table('appointments')->insert([
                'client_id' => $clientId,
                'location_id' => $locationId,
                'start_time' => Carbon::today()->setTime(14, 0),
                'end_time' => Carbon::today()->setTime(15, 0),
                'status' => 'confirmed',
                'notes' => 'Upcoming skin consultation',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            // Future appointment
            DB::table('appointments')->insert([
                'client_id' => $clientId,
                'location_id' => $locationId,
                'start_time' => Carbon::now()->addDays(7)->setTime(16, 0),
                ' Anyone_time' => Carbon::now()->addDays(7)->setTime(17, 0),
                'status' => 'booked',
                'notes' => 'Future treatment session',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }

        // Create 2 payments
        $paymentCount = DB::table('payments')->where('client_id', $clientId)->count();
        if ($paymentCount < 2) {
            echo "Creating payments...\n";
            
            // Completed payment
            DB::table('payments')->insert([
                'client_id' => $clientId,
                'amount' => 150.00,
                'payment_method' => 'card',
                'status' => 'completed',
                'created_at' => Carbon::now()->subDays(5),
                'updated_at' => Carbon::now()->subDays(5),
            ]);

            // Pending payment
            DB::table('payments')->insert([
                'client_id' => $clientId,
                'amount' => 85.00,
                'payment_method' => 'cash',
                'status' => 'pending',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }

        // Create 1-2 packages
        $packageCount = DB::table('packages')->count();
        if ($packageCount < 2) {
            echo "Creating packages...\n";
            
            $package1Id = DB::table('packages')->insertGetId([
                'name' => 'Premium Facial Package',
                'description' => '5 sessions facial treatment',
                'price' => 500.00,
                'duration' => 60,
                'services_included' => json_encode(['Facial', 'Cleaning']),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            $package2Id = DB::table('packages')->insertGetId([
                'name' => 'Beauty Essentials',
                'description' => '3 sessions basic package',
                'price' => 250.00,
                'duration' => 45,
                'services_included' => json_encode(['Cleaning']),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        } else {
            $packages = DB::table('packages')->limit(2)->get();
            $package1Id = $packages[0]->id;
            $package2Id = $packages[1]->id ?? $packages[0]->id;
        }

        // Assign packages to client
        $clientPackageCount = DB::table('client_packages')->where('client_id', $clientId)->count();
        if ($clientPackageCount < 2) {
            echo "Assigning packages to client...\n";
            
            // Check if package 1 already assigned
            $existing1 = DB::table('client_packages')
                ->where('client_id', $clientId)
                ->where('package_id', $package1Id)
                ->first();
            
            if (!$existing1) {
                DB::table('client_packages')->insert([
                    'client_id' => $clientId,
                    'package_id' => $package1Id,
                    'assigned_at' => Carbon::now()->subDays(10),
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }

            if ($package2Id) {
                // Check if package 2 already assigned
                $existing2 = DB::table('client_packages')
                    ->where('client_id', $clientId)
                    ->where('package_id', $package2Id)
                    ->first();
                
                if (!$existing2) {
                    DB::table('client_packages')->insert([
                        'client_id' => $clientId,
                        'package_id' => $package2Id,
                        'assigned_at' => Carbon::now()->subDays(5),
                        'created_at' => Carbon::now(),
                        'updated_at' => Carbon::now(),
                    ]);
                }
            }
        }

        // Create 2 consent forms
        $consentCount = DB::table('consent_forms')->where('client_id', $clientId)->count();
        if ($consentCount < 2) {
            echo "Creating consent forms...\n";
            
            // Get service
            $service = DB::table('services')->first();
            if ($service) {
                $serviceId = $service->id;
            } else {
                $serviceId = DB::table('services')->insertGetId([
                    'name' => 'Facial Treatment',
                    'description' => 'Deep cleansing facial',
                    'price' => 100.00,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }

            DB::table('consent_forms')->insert([
                'client_id' => $clientId,
                'service_id' => $serviceId,
                'form_type' => 'consent',
                'digital_signature' => 'John Doe',
                'date_signed' => Carbon::now()->subDays(10),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            DB::table('consent_forms')->insert([
                'client_id' => $clientId,
                'service_id' => $serviceId,
                'form_type' => 'intake',
                'digital_signature' => 'John Doe',
                'date_signed' => Carbon::now()->subDays(5),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }

        echo "✅ Client data seeded successfully!\n";
        echo "   - Client ID: $clientId\n";
        echo "   - 3 Appointments\n";
        echo "   - 2 Payments\n";
        echo "   - 2 Packages assigned\n";
        echo "   - 2 Consent Forms\n";
    }
}

