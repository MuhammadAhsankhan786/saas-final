<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Payment;
use App\Models\Client;
use App\Models\Location;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class StaffPerformanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "🌱 Seeding Staff Performance Data...\n";

        // Get or create a location
        $location = Location::first();
        if (!$location) {
            $location = Location::create([
                'name' => 'Main Location',
                'address' => '123 Main St',
                'city' => 'New York',
                'state' => 'NY',
                'zip' => '10001',
                'phone' => '+1234567890',
                'timezone' => 'America/New_York',
                'status' => 'active',
            ]);
        }

        // Create multiple staff members (providers and reception)
        $staffMembers = collect([]);
        
        // Create 5 providers
        $providerNames = ['Dr. Sarah Chen', 'Dr. Michael Johnson', 'Dr. Emily Smith', 'Dr. David Brown', 'Dr. Lisa Anderson'];
        foreach ($providerNames as $index => $name) {
            $email = 'provider' . ($index + 1) . '@medispa.com';
            $staffData = [
                'name' => $name,
                'password' => Hash::make('demo123'),
                'role' => 'provider',
                'phone' => '+123456789' . $index,
                'created_at' => Carbon::now()->subMonths(6),
                'updated_at' => Carbon::now(),
            ];
            
            // Only add location_id if column exists
            if (DB::getSchemaBuilder()->hasColumn('users', 'location_id')) {
                $staffData['location_id'] = $location->id;
            }
            
            $staff = User::updateOrCreate(
                ['email' => $email],
                $staffData
            );
            $staffMembers->push($staff);
            echo "✅ Created provider: {$name}\n";
        }

        // Create 3 reception staff
        $receptionNames = ['Jane Williams', 'Robert Taylor', 'Maria Garcia'];
        foreach ($receptionNames as $index => $name) {
            $email = 'reception' . ($index + 1) . '@medispa.com';
            $staffData = [
                'name' => $name,
                'password' => Hash::make('demo123'),
                'role' => 'reception',
                'phone' => '+123456780' . $index,
                'created_at' => Carbon::now()->subMonths(6),
                'updated_at' => Carbon::now(),
            ];
            
            // Only add location_id if column exists
            if (DB::getSchemaBuilder()->hasColumn('users', 'location_id')) {
                $staffData['location_id'] = $location->id;
            }
            
            $staff = User::updateOrCreate(
                ['email' => $email],
                $staffData
            );
            $staffMembers->push($staff);
            echo "✅ Created reception: {$name}\n";
        }

        // Get or create services
        $services = Service::all();
        if ($services->isEmpty()) {
            $serviceNames = ['Facial Treatment', 'Massage Therapy', 'Laser Treatment', 'Chemical Peel', 'Microdermabrasion'];
            foreach ($serviceNames as $serviceName) {
                $services->push(Service::create([
                    'name' => $serviceName,
                    'description' => 'Professional ' . $serviceName,
                    'duration' => rand(30, 120),
                    'price' => rand(50, 300),
                    'category' => 'Treatment',
                    'status' => 'active',
                ]));
            }
        }

        // Get or create clients
        $clients = Client::all();
        if ($clients->isEmpty()) {
            for ($i = 1; $i <= 20; $i++) {
                Client::create([
                    'first_name' => 'Client',
                    'last_name' => "User{$i}",
                    'email' => "client{$i}@example.com",
                    'phone' => '+123456789' . str_pad($i, 2, '0', STR_PAD_LEFT),
                    'date_of_birth' => Carbon::now()->subYears(rand(25, 65)),
                    'gender' => ['Male', 'Female', 'Other'][rand(0, 2)],
                    'address' => "{$i} Client Street",
                    'city' => 'New York',
                    'state' => 'NY',
                    'zip_code' => '1000' . str_pad($i, 1, '0', STR_PAD_LEFT),
                    'status' => 'active',
                ]);
            }
            $clients = Client::all(); // Refresh collection
        }

        // Create appointments and payments for the past 6 months
        $startDate = Carbon::now()->subMonths(6);
        $endDate = Carbon::now();
        
        $appointmentCount = 0;
        $paymentCount = 0;

        // Distribute appointments over 6 months
        for ($month = 0; $month < 6; $month++) {
            $monthStart = $startDate->copy()->addMonths($month)->startOfMonth();
            $monthEnd = $startDate->copy()->addMonths($month)->endOfMonth();
            
            // Create 15-25 appointments per month
            $appointmentsPerMonth = rand(15, 25);
            
            for ($i = 0; $i < $appointmentsPerMonth; $i++) {
                // Random staff member (only providers for appointments)
                $provider = $staffMembers->where('role', 'provider')->random();
                $client = $clients->random();
                $service = $services->random();
                
                // Random date within the month
                $appointmentDate = Carbon::createFromTimestamp(
                    rand($monthStart->timestamp, $monthEnd->timestamp)
                );
                
                // Random status (mostly completed for performance metrics)
                // Valid appointment statuses: 'booked', 'completed', 'canceled'
                $statuses = ['completed', 'completed', 'completed', 'completed', 'booked', 'canceled'];
                $status = $statuses[array_rand($statuses)];
                
                $serviceDuration = $service->duration ?? 60;
                $appointment = Appointment::create([
                    'client_id' => $client->id,
                    'provider_id' => $provider->id,
                    'service_id' => $service->id,
                    'location_id' => $location->id,
                    'appointment_time' => $appointmentDate,
                    'start_time' => $appointmentDate,
                    'end_time' => $appointmentDate->copy()->addMinutes($serviceDuration),
                    'status' => $status,
                    'notes' => 'Staff performance test appointment',
                    'created_at' => $appointmentDate->copy()->subDays(rand(1, 7)),
                    'updated_at' => $appointmentDate,
                ]);
                
                $appointmentCount++;
                
                // Create payment for completed appointments
                if ($status === 'completed') {
                    $amount = $service->price ?? rand(100, 500);
                    $tips = rand(0, 50);
                    $commission = round($amount * 0.15, 2); // 15% commission
                    
                    // Payment method enum only allows 'stripe' or 'cash'
                    Payment::create([
                        'appointment_id' => $appointment->id,
                        'client_id' => $client->id,
                        'amount' => $amount,
                        'tips' => $tips,
                        'commission' => $commission,
                        'payment_method' => ['stripe', 'cash'][rand(0, 1)],
                        'status' => 'completed',
                        'created_at' => $appointmentDate->copy()->addMinutes(rand(30, 120)),
                        'updated_at' => $appointmentDate,
                    ]);
                    
                    $paymentCount++;
                }
            }
        }

        echo "✅ Created {$appointmentCount} appointments\n";
        echo "✅ Created {$paymentCount} payments\n";
        echo "✅ Staff Performance data seeded successfully!\n";
    }
}

