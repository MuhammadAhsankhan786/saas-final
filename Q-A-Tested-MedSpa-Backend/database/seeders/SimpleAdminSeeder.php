<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SimpleAdminSeeder extends Seeder
{
    public function run()
    {
        echo "🌱 Seeding sample data for Admin Dashboard...\n";
        
        // Get or create location
        $location = DB::table('locations')->first();
        if (!$location) {
            DB::table('locations')->insert([
                'name' => 'Main Location',
                'address' => '123 Main St',
                'city' => 'New York',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            $locationId = DB::getPdo()->lastInsertId();
        } else {
            $locationId = $location->id;
        }

        // Create appointments if they exist
        $existingAppointments = DB::table('appointments')->count();
        if ($existingAppointments == 0) {
            echo "   Creating appointments...\n";
            // Get clients
            $clients = DB::table('clients')->pluck('id')->toArray();
            
            if (empty($clients)) {
                // Create a dummy client first
                $userId = DB::table('users')->insertGetId([
                    'name' => 'Test Client',
                    'email' => 'testclient@test.com',
                    'password' => bcrypt('password'),
                    'role' => 'client',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
                
                $clientId = DB::table('clients')->insertGetId([
                    'user_id' => $userId,
                    'name' => 'Test Client',
                    'email' => 'testclient@test.com',
                    'location_id' => $locationId,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
                $clients = [$clientId];
            }
            
            for ($i = 0; $i < 5; $i++) {
                $startTime = Carbon::now()->addDays(rand(-30, 30));
                DB::table('appointments')->insert([
                    'client_id' => $clients[array_rand($clients)],
                    'location_id' => $locationId,
                    'start_time' => $startTime,
                    'end_time' => $startTime->copy()->addHour(),
                    'status' => 'booked',
                    'notes' => "Sample appointment #" . ($i + 1),
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }
        }

        echo "✅ Sample data created!\n";
        echo "   - Appointments: " . DB::table('appointments')->count() . "\n";
        echo "   - Clients: " . DB::table('clients')->count() . "\n";
    }
}


