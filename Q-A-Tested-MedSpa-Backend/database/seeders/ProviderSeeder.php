<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class ProviderSeeder extends Seeder
{
    public function run()
    {
        echo "🌱 Seeding providers...\n";

        // Check if providers already exist
        $existingProviders = DB::table('users')->where('role', 'provider')->count();
        
        if ($existingProviders > 0) {
            echo "✅ Providers already exist ($existingProviders providers)\n";
            return;
        }

        // Create 3 providers
        $location = DB::table('locations')->first();
        $locationId = $location ? $location->id : 1;

        $providers = [
            [
                'name' => 'Dr. Sarah Johnson',
                'email' => 'provider1@example.com',
                'password' => Hash::make('password'),
                'role' => 'provider',
                'location_id' => $locationId,
                'phone' => '+1234567890',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Dr. Michael Chen',
                'email' => 'provider2@example.com',
                'password' => Hash::make('password'),
                'role' => 'provider',
                'location_id' => $locationId,
                'phone' => '+1234567891',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Dr. Emily Davis',
                'email' => 'provider3@example.com',
                'password' => Hash::make('password'),
                'role' => 'provider',
                'location_id' => $locationId,
                'phone' => '+1234567892',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        foreach ($providers as $provider) {
            DB::table('users')->insert($provider);
        }

        echo "✅ Created " . count($providers) . " providers\n";
    }
}

