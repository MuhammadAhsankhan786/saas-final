<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\Payment;
use App\Models\Package;
use App\Models\Service;
use App\Models\Location;
use App\Models\User;
use App\Models\ConsentForm;
use App\Models\ClientPackage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class ClientDataSeederController extends Controller
{
    /**
     * Seed all data for client role
     * Ensures client has: appointments, payments, packages, consents
     */
    public static function seedClientData($force = false)
    {
        try {
            DB::beginTransaction();
            
            // Get or create client user
            $clientUser = User::where('role', 'client')->first();
            
            if (!$clientUser) {
                $clientUser = User::create([
                    'name' => 'Test Client',
                    'email' => 'client@pulse.com',
                    'password' => Hash::make('client123'),
                    'role' => 'client',
                    'phone' => '+1234567890',
                ]);
                Log::info('Created client user', ['user_id' => $clientUser->id]);
            }
            
            // Get or create location
            $location = Location::first();
            if (!$location) {
                $location = Location::create([
                    'name' => 'Main Branch',
                    'address' => '123 Main St',
                    'city' => 'City',
                    'state' => 'State',
                    'zip' => '12345',
                    'timezone' => 'UTC',
                ]);
                Log::info('Created location', ['location_id' => $location->id]);
            }
            
            // Get or create client profile
            $client = Client::where('user_id', $clientUser->id)->first();
            if (!$client) {
                $client = Client::create([
                    'user_id' => $clientUser->id,
                    'name' => $clientUser->name,
                    'email' => $clientUser->email,
                    'phone' => $clientUser->phone ?? '+1234567890',
                    'location_id' => $location->id,
                ]);
                Log::info('Created client profile', ['client_id' => $client->id]);
            }
            
            // Get or create services
            $service1 = Service::first();
            if (!$service1) {
                $service1 = Service::create([
                    'name' => 'Facial Treatment',
                    'category' => 'Facial',
                    'price' => 150.00,
                    'duration' => 60,
                    'description' => 'Deep cleansing facial treatment',
                ]);
            }
            
            $service2 = Service::where('name', 'Massage Therapy')->first();
            if (!$service2) {
                $service2 = Service::create([
                    'name' => 'Massage Therapy',
                    'category' => 'Massage',
                    'price' => 120.00,
                    'duration' => 90,
                    'description' => 'Full body massage',
                ]);
            }
            
            // Seed Appointments (at least 3: past, today, future)
            $appointmentCount = Appointment::where('client_id', $client->id)->count();
            if ($force || $appointmentCount < 3) {
                // Past appointment (completed)
                Appointment::firstOrCreate(
                    [
                        'client_id' => $client->id,
                        'start_time' => Carbon::now()->subDays(5)->setTime(10, 0)->format('Y-m-d H:i:s'),
                    ],
                    [
                        'location_id' => $location->id,
                        'service_id' => $service1->id,
                        'appointment_time' => Carbon::now()->subDays(5)->setTime(10, 0)->format('Y-m-d H:i:s'),
                        'start_time' => Carbon::now()->subDays(5)->setTime(10, 0)->format('Y-m-d H:i:s'),
                        'end_time' => Carbon::now()->subDays(5)->setTime(11, 0)->format('Y-m-d H:i:s'),
                        'status' => 'completed',
                        'notes' => 'Completed facial treatment session',
                    ]
                );
                
                // Today's appointment (booked)
                Appointment::firstOrCreate(
                    [
                        'client_id' => $client->id,
                        'start_time' => Carbon::today()->setTime(14, 0)->format('Y-m-d H:i:s'),
                    ],
                    [
                        'location_id' => $location->id,
                        'service_id' => $service1->id,
                        'appointment_time' => Carbon::today()->setTime(14, 0)->format('Y-m-d H:i:s'),
                        'start_time' => Carbon::today()->setTime(14, 0)->format('Y-m-d H:i:s'),
                        'end_time' => Carbon::today()->setTime(15, 0)->format('Y-m-d H:i:s'),
                        'status' => 'booked',
                        'notes' => 'Upcoming skin consultation',
                    ]
                );
                
                // Future appointment (booked)
                Appointment::firstOrCreate(
                    [
                        'client_id' => $client->id,
                        'start_time' => Carbon::now()->addDays(7)->setTime(16, 0)->format('Y-m-d H:i:s'),
                    ],
                    [
                        'location_id' => $location->id,
                        'service_id' => $service2->id,
                        'appointment_time' => Carbon::now()->addDays(7)->setTime(16, 0)->format('Y-m-d H:i:s'),
                        'start_time' => Carbon::now()->addDays(7)->setTime(16, 0)->format('Y-m-d H:i:s'),
                        'end_time' => Carbon::now()->addDays(7)->setTime(17, 0)->format('Y-m-d H:i:s'),
                        'status' => 'booked',
                        'notes' => 'Future treatment session',
                    ]
                );
                
                Log::info('Seeded appointments for client', ['client_id' => $client->id]);
            }
            
            // Seed Payments (at least 2)
            $paymentCount = Payment::where('client_id', $client->id)->count();
            if ($force || $paymentCount < 2) {
                // Get appointments for linking
                $appointments = Appointment::where('client_id', $client->id)->get();
                
                // Payment 1 (completed)
                Payment::firstOrCreate(
                    [
                        'client_id' => $client->id,
                        'amount' => 150.00,
                        'created_at' => Carbon::now()->subDays(5),
                    ],
                    [
                        'appointment_id' => $appointments->first()?->id,
                        'payment_method' => 'stripe',
                        'status' => 'completed',
                        'tips' => 20.00,
                        'commission' => 30.00,
                        'transaction_id' => 'TXN-' . strtoupper(uniqid()),
                        'stripe_payment_intent_id' => 'pi_' . strtolower(uniqid()),
                    ]
                );
                
                // Payment 2 (completed)
                Payment::firstOrCreate(
                    [
                        'client_id' => $client->id,
                        'amount' => 120.00,
                        'created_at' => Carbon::now()->subDays(2),
                    ],
                    [
                        'appointment_id' => $appointments->skip(1)->first()?->id,
                        'payment_method' => 'cash',
                        'status' => 'completed',
                        'tips' => 15.00,
                        'commission' => 25.00,
                        'transaction_id' => 'TXN-' . strtoupper(uniqid()),
                    ]
                );
                
                Log::info('Seeded payments for client', ['client_id' => $client->id]);
            }
            
            // Seed Packages (at least 2)
            $package1 = Package::where('name', 'Premium Facial Package')->first();
            if (!$package1) {
                $package1 = Package::create([
                    'name' => 'Premium Facial Package',
                    'description' => '5 sessions facial treatment package',
                    'price' => 500.00,
                    'duration' => 60,
                    'services_included' => json_encode(['Facial Treatment', 'Cleaning']),
                ]);
            }
            
            $package2 = Package::where('name', 'Beauty Essentials')->first();
            if (!$package2) {
                $package2 = Package::create([
                    'name' => 'Beauty Essentials',
                    'description' => '3 sessions basic beauty package',
                    'price' => 250.00,
                    'duration' => 45,
                    'services_included' => json_encode(['Massage Therapy', 'Cleaning']),
                ]);
            }
            
            // Assign packages to client
            $clientPackageCount = ClientPackage::where('client_id', $client->id)->count();
            if ($force || $clientPackageCount < 2) {
                // Check if already exists
                $existing1 = ClientPackage::where('client_id', $client->id)
                    ->where('package_id', $package1->id)
                    ->first();
                
                if (!$existing1) {
                    ClientPackage::create([
                        'client_id' => $client->id,
                        'package_id' => $package1->id,
                        'assigned_at' => Carbon::now()->subDays(10),
                    ]);
                }
                
                $existing2 = ClientPackage::where('client_id', $client->id)
                    ->where('package_id', $package2->id)
                    ->first();
                
                if (!$existing2) {
                    ClientPackage::create([
                        'client_id' => $client->id,
                        'package_id' => $package2->id,
                        'assigned_at' => Carbon::now()->subDays(5),
                    ]);
                }
                
                Log::info('Seeded client packages', ['client_id' => $client->id]);
            }
            
            // Seed Consent Forms (at least 2)
            $consentCount = ConsentForm::where('client_id', $client->id)->count();
            if ($force || $consentCount < 2) {
                ConsentForm::firstOrCreate(
                    [
                        'client_id' => $client->id,
                        'service_id' => $service1->id,
                        'form_type' => 'consent',
                    ],
                    [
                        'digital_signature' => $client->name,
                        'date_signed' => Carbon::now()->subDays(10),
                    ]
                );
                
                ConsentForm::firstOrCreate(
                    [
                        'client_id' => $client->id,
                        'service_id' => $service1->id,
                        'form_type' => 'intake',
                    ],
                    [
                        'digital_signature' => $client->name,
                        'date_signed' => Carbon::now()->subDays(5),
                    ]
                );
                
                Log::info('Seeded consent forms for client', ['client_id' => $client->id]);
            }
            
            DB::commit();
            
            $summary = [
                'client_id' => $client->id,
                'appointments' => Appointment::where('client_id', $client->id)->count(),
                'payments' => Payment::where('client_id', $client->id)->count(),
                'packages' => ClientPackage::where('client_id', $client->id)->count(),
                'consents' => ConsentForm::where('client_id', $client->id)->count(),
            ];
            
            Log::info('✅ Client data seeded successfully', $summary);
            
            return $summary;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Client data seeding failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return null;
        }
    }
}

