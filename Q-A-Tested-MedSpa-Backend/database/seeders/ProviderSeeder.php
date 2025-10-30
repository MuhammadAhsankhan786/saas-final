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

        // Ensure canonical provider account first
        $location = DB::table('locations')->first();
        $locationId = $location ? $location->id : 1;

        $canonical = DB::table('users')->where('email', 'provider@medispa.com')->first();
        if (!$canonical) {
            DB::table('users')->insert([
                'name' => 'Test Provider',
                'email' => 'provider@medispa.com',
                'password' => Hash::make('demo123'),
                'role' => 'provider',
                'location_id' => $locationId,
                'phone' => '+1234567890',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }

        echo "✅ Ensured provider@medispa.com (demo123)\n";
    }
}

