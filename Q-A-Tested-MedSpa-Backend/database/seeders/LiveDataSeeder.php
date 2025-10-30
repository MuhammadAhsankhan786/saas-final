<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Carbon\Carbon;

class LiveDataSeeder extends Seeder
{
    public function run(): void
    {
        // Live mode: insert minimal, realistic rows only if table has < 5 records
        $now = Carbon::now();

        // Ensure a location exists for foreign keys
        $locationId = DB::table('locations')->value('id');
        if (!$locationId) {
            $locationId = DB::table('locations')->insertGetId([
                'name' => 'Main Branch',
                'address' => '123 Main St',
                'city' => 'City',
                'state' => 'State',
                'zip' => '00000',
                'timezone' => 'UTC',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // 1) Users (ensure at least one per key role)
        $userCount = DB::table('users')->count();
        if ($userCount < 5) {
            $usersToEnsure = [
                ['name' => 'Clinic Admin', 'email' => 'admin@clinic.local', 'role' => 'admin'],
                ['name' => 'Front Desk', 'email' => 'reception@clinic.local', 'role' => 'reception'],
                ['name' => 'Lead Provider', 'email' => 'provider@clinic.local', 'role' => 'provider'],
                ['name' => 'Client Portal', 'email' => 'client@clinic.local', 'role' => 'client'],
            ];
            foreach ($usersToEnsure as $u) {
                DB::table('users')->updateOrInsert(
                    ['email' => $u['email']],
                    [
                        'name' => $u['name'],
                        'password' => Hash::make('changeMe!123'),
                        'role' => $u['role'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }

        // Helper ids
        $providerId = DB::table('users')->where('role', 'provider')->value('id') ?? DB::table('users')->insertGetId([
            'name' => 'Derm Provider', 'email' => 'derm@clinic.local', 'password' => Hash::make('changeMe!123'), 'role' => 'provider', 'created_at' => $now, 'updated_at' => $now,
        ]);

        // 2) Clients (basic profiles)
        $clientCount = DB::table('clients')->count();
        if ($clientCount < 5) {
            $sampleClients = [
                ['name' => 'Alice Johnson', 'email' => 'alice@clients.local', 'phone' => '555-0101'],
                ['name' => 'Bob Smith', 'email' => 'bob@clients.local', 'phone' => '555-0102'],
                ['name' => 'Carla Diaz', 'email' => 'carla@clients.local', 'phone' => '555-0103'],
                ['name' => 'David Lee', 'email' => 'david@clients.local', 'phone' => '555-0104'],
                ['name' => 'Eva Park', 'email' => 'eva@clients.local', 'phone' => '555-0105'],
            ];
            $clientUserIds = [];
            foreach ($sampleClients as $c) {
                // Ensure a backing user exists for this client email
                $clientUserId = DB::table('users')->where('email', $c['email'])->value('id');
                if (!$clientUserId) {
                    $clientUserId = DB::table('users')->insertGetId([
                        'name' => $c['name'],
                        'email' => $c['email'],
                        'password' => Hash::make('changeMe!123'),
                        'role' => 'client',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
                DB::table('clients')->updateOrInsert(
                    ['email' => $c['email']],
                    [
                        'user_id' => $clientUserId,
                        'name' => $c['name'],
                        'email' => $c['email'],
                        'phone' => $c['phone'],
                        'location_id' => $locationId,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
                $clientUserIds[] = $clientUserId;
            }
        }

        // 3) Services (catalog)
        $serviceCount = DB::table('services')->count();
        if ($serviceCount < 5) {
            $services = [
                ['category' => 'Facial', 'name' => 'Hydrating Facial', 'price' => 120.00],
                ['category' => 'Laser', 'name' => 'Laser Hair Removal', 'price' => 150.00],
                ['category' => 'Injectables', 'name' => 'Botox Treatment', 'price' => 220.00],
                ['category' => 'Peel', 'name' => 'Chemical Peel', 'price' => 180.00],
                ['category' => 'Massage', 'name' => 'Therapeutic Massage', 'price' => 90.00],
            ];
            foreach ($services as $s) {
                DB::table('services')->updateOrInsert(
                    ['name' => $s['name']],
                    [
                        'category' => $s['category'],
                        'description' => null,
                        'price' => $s['price'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }

        // 4) Products (inventory) - match schema (minimum_stock)
        $productCount = DB::table('products')->count();
        if ($productCount < 5) {
            $products = [
                ['name' => 'Vitamin C Serum', 'sku' => 'VC-100', 'price' => 45.00, 'current_stock' => 30, 'minimum_stock' => 5, 'unit' => 'ml'],
                ['name' => 'Hyaluronic Acid', 'sku' => 'HA-200', 'price' => 38.00, 'current_stock' => 20, 'minimum_stock' => 5, 'unit' => 'ml'],
                ['name' => 'Retinol Cream', 'sku' => 'RT-300', 'price' => 50.00, 'current_stock' => 15, 'minimum_stock' => 5, 'unit' => 'ml'],
                ['name' => 'Sunscreen SPF50', 'sku' => 'SS-400', 'price' => 25.00, 'current_stock' => 40, 'minimum_stock' => 10, 'unit' => 'ml'],
                ['name' => 'Collagen Mask', 'sku' => 'CM-500', 'price' => 30.00, 'current_stock' => 12, 'minimum_stock' => 3, 'unit' => 'pcs'],
            ];
            foreach ($products as $p) {
                DB::table('products')->updateOrInsert(
                    ['sku' => $p['sku']],
                    [
                        'name' => $p['name'],
                        'price' => $p['price'],
                        'current_stock' => $p['current_stock'],
                        'minimum_stock' => $p['minimum_stock'],
                        'unit' => $p['unit'],
                        'active' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }

        // Helper lookups
        $clientIds = DB::table('clients')->pluck('id')->take(5)->all();
        // Prefer user IDs for appointments if available
        $clientUserIds = isset($clientUserIds) && $clientUserIds ? $clientUserIds : DB::table('users')->where('role','client')->pluck('id')->take(5)->all();
        $serviceIds = DB::table('services')->pluck('id')->take(5)->all();

        // 5) Appointments (support both schemas)
        $apptCount = DB::table('appointments')->count();
        if ($apptCount < 5 && !empty($clientIds)) {
            for ($i = 0; $i < 5; $i++) {
                $start = Carbon::now()->addDays($i)->setTime(10 + $i, 0);
                $data = [
                    'client_id' => $clientUserIds[$i % count($clientUserIds)],
                    'status' => 'booked',
                    'notes' => 'Live appointment',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
                if (Schema::hasColumn('appointments', 'start_time')) {
                    $data['start_time'] = $start;
                    if (Schema::hasColumn('appointments', 'end_time')) {
                        $data['end_time'] = (clone $start)->addHour();
                    }
                }
                if (Schema::hasColumn('appointments', 'appointment_time')) {
                    $data['appointment_time'] = $start;
                }
                if (Schema::hasColumn('appointments', 'location_id')) {
                    $data['location_id'] = 1;
                }
                DB::table('appointments')->insert($data);
            }
        }

        // 6) Treatments (linked to first appointment if available)
        $treatCount = DB::table('treatments')->count();
        if ($treatCount < 5) {
            $apptId = DB::table('appointments')->value('id');
            if ($apptId) {
                for ($i = 0; $i < 5; $i++) {
                    DB::table('treatments')->updateOrInsert(
                        ['appointment_id' => $apptId, 'provider_id' => $providerId, 'treatment_type' => 'facial'],
                        [
                            'cost' => 100 + ($i * 10),
                            'status' => 'completed',
                            'description' => 'Live treatment record',
                            'treatment_date' => Carbon::now()->subDays($i),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );
                }
            }
        }

        // 7) Payments
        $payCount = DB::table('payments')->count();
        if ($payCount < 5 && !empty($clientIds)) {
            $methods = ['cash','card','check'];
            for ($i = 0; $i < 5; $i++) {
                DB::table('payments')->insertOrIgnore([
                    'client_id' => $clientIds[$i % count($clientIds)],
                    'amount' => 80 + ($i * 20),
                    'payment_method' => $methods[$i % count($methods)],
                    'status' => 'completed',
                    'created_at' => $now->copy()->subDays($i),
                    'updated_at' => $now,
                ]);
            }
        }

        // 8) Consent forms
        $cfCount = DB::table('consent_forms')->count();
        if ($cfCount < 5 && !empty($clientIds) && !empty($serviceIds)) {
            for ($i = 0; $i < 5; $i++) {
                DB::table('consent_forms')->updateOrInsert(
                    ['client_id' => $clientIds[$i % count($clientIds)], 'service_id' => $serviceIds[$i % count($serviceIds)], 'form_type' => 'consent'],
                    [
                        'digital_signature' => 'signed',
                        'date_signed' => Carbon::now()->subDays(10 - $i),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }
    }
}


