<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\Payment;
use App\Models\Package;
use App\Models\Service;
use App\Models\Product;
use App\Models\Location;
use App\Models\User;
use App\Models\Treatment;
use App\Models\ConsentForm;
use App\Models\ComplianceAlert;
use App\Models\StockAdjustment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeederController extends Controller
{
    /**
     * Auto-seed missing essential data for both Provider and Reception roles.
     * This runs automatically when endpoints detect empty tables.
     * 
     * Provider Role Requirements:
     * - provider@medispa.com / demo123
     * - Main Branch location
     * - 2 services: Facial Treatment, Massage Therapy
     * - 2 clients linked to provider
     * - 3 appointments for today (09:00, 11:00, 14:00)
     * - 1 treatment linked to appointment
     * - 1 pending consent
     * - 1 product usage record (inventory/stock adjustment)
     * - 1 compliance alert (pending)
     * 
     * Reception Role Requirements:
     * - reception@medispa.com / demo123
     * - 3 appointments for today (linked to provider, clients)
     * - 1-2 payments (linked to appointments)
     * - 2 packages (Basic, Premium)
     * - 2 products (for POS)
     * - 1 service if missing
     * - 1 location if missing
     */
    public static function seedMissingData($force = false)
    {
        try {
            $seeded = [];
            DB::beginTransaction();
            
            // ============================================
            // STEP 1: Seed Core Infrastructure (Location)
            // ============================================
            $location = null;
            if ($force || !Location::query()->exists()) {
                try {
                    $location = Location::firstOrCreate(
                        ['name' => 'Main Branch'],
                        [
                            'address' => '123 Main St',
                            'city' => 'City',
                            'state' => 'State',
                            'zip' => '12345',
                            'timezone' => 'UTC'
                        ]
                    );
                    if (!$location->wasRecentlyCreated && Location::count() == 1) {
                        $seeded[] = 'locations';
                        Log::info('Location already exists', ['location_id' => $location->id]);
                    } else {
                        $seeded[] = 'locations';
                        Log::info('Seeded locations table', ['location_id' => $location->id]);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to seed locations', ['error' => $e->getMessage()]);
                    $location = Location::first();
                }
            } else {
                $location = Location::first();
            }
            
            // ============================================
            // STEP 2: Seed Services
            // ============================================
            $service1 = null;
            $service2 = null;
            if ($force || !Service::query()->exists()) {
                $service1 = Service::firstOrCreate(
                    ['name' => 'Facial Treatment'],
                    [
                        'price' => 150.00,
                        'duration' => 60,
                        'description' => 'Relaxing facial treatment'
                    ]
                );
                $service2 = Service::firstOrCreate(
                    ['name' => 'Massage Therapy'],
                    [
                        'price' => 200.00,
                        'duration' => 90,
                        'description' => 'Full body massage therapy'
                    ]
                );
                $seeded[] = 'services';
                Log::info('Seeded services table', ['service_ids' => [$service1->id, $service2->id]]);
            } else {
                $service1 = Service::first();
                $service2 = Service::skip(1)->first() ?? $service1;
            }
            
            // ============================================
            // STEP 3: Seed Products (for Reception POS + Provider Inventory)
            // ============================================
            $product1 = null;
            $product2 = null;
            if ($force || !Product::query()->exists()) {
                $product1 = Product::firstOrCreate(
                    ['name' => 'Skincare Product'],
                    [
                        'price' => 50.00,
                        'stock' => 100,
                        'category' => 'skincare',
                        'description' => 'Premium skincare product'
                    ]
                );
                $product2 = Product::firstOrCreate(
                    ['name' => 'Spa Gift Set'],
                    [
                        'price' => 75.00,
                        'stock' => 50,
                        'category' => 'gifts',
                        'description' => 'Luxury spa gift set'
                    ]
                );
                $seeded[] = 'products';
                Log::info('Seeded products table', ['product_ids' => [$product1->id, $product2->id]]);
            } else {
                $product1 = Product::first();
                $product2 = Product::skip(1)->first() ?? $product1;
            }
            
            // ============================================
            // STEP 4: Seed Packages (for Reception)
            // ============================================
            $package1 = null;
            $package2 = null;
            if ($force || !Package::query()->exists()) {
                $package1 = Package::firstOrCreate(
                    ['name' => 'Basic Package'],
                    [
                        'price' => 300.00,
                        'duration' => 120,
                        'description' => 'Basic spa package'
                    ]
                );
                $package2 = Package::firstOrCreate(
                    ['name' => 'Premium Package'],
                    [
                        'price' => 500.00,
                        'duration' => 180,
                        'description' => 'Premium spa package'
                    ]
                );
                $seeded[] = 'packages';
                Log::info('Seeded packages table', ['package_ids' => [$package1->id, $package2->id]]);
            } else {
                $package1 = Package::first();
                $package2 = Package::skip(1)->first() ?? $package1;
            }
            
            // ============================================
            // STEP 5: Seed Provider User
            // ============================================
            $provider = User::where('email', 'provider@medispa.com')->first();
            if (!$provider) {
                $provider = User::updateOrCreate(
                    ['email' => 'provider@medispa.com'],
                    [
                        'name' => 'Dr. Provider',
                        'password' => Hash::make('demo123'),
                        'role' => 'provider',
                    ]
                );
                $seeded[] = 'provider_user';
                Log::info('Seeded provider user', ['provider_id' => $provider->id]);
            }
            
            // ============================================
            // STEP 6: Seed Reception User
            // ============================================
            $reception = User::where('email', 'reception@medispa.com')->first();
            if (!$reception) {
                $reception = User::updateOrCreate(
                    ['email' => 'reception@medispa.com'],
                    [
                        'name' => 'Reception Staff',
                        'password' => Hash::make('demo123'),
                        'role' => 'reception',
                    ]
                );
                $seeded[] = 'reception_user';
                Log::info('Seeded reception user', ['reception_id' => $reception->id]);
            }
            
            // ============================================
            // STEP 7: Seed Clients (3 for Admin view, linked to provider)
            // ============================================
            $client1 = null;
            $client2 = null;
            $client3 = null;
            if ($force || Client::query()->count() < 3) {
                // Client 1
                $clientUser1 = User::updateOrCreate(
                    ['email' => 'client1@demo.com'],
                    [
                        'name' => 'Alice Johnson',
                        'password' => Hash::make('demo123'),
                        'role' => 'client',
                    ]
                );
                $client1 = Client::updateOrCreate(
                    ['email' => 'client1@demo.com'],
                    [
                        'user_id' => $clientUser1->id,
                        'name' => 'Alice Johnson',
                        'phone' => '555-0101',
                        'location_id' => $location?->id,
                        'preferred_provider_id' => $provider->id,
                        'status' => 'active',
                    ]
                );
                
                // Client 2
                $clientUser2 = User::updateOrCreate(
                    ['email' => 'client2@demo.com'],
                    [
                        'name' => 'Bob Smith',
                        'password' => Hash::make('demo123'),
                        'role' => 'client',
                    ]
                );
                $client2 = Client::updateOrCreate(
                    ['email' => 'client2@demo.com'],
                    [
                        'user_id' => $clientUser2->id,
                        'name' => 'Bob Smith',
                        'phone' => '555-0102',
                        'location_id' => $location?->id,
                        'preferred_provider_id' => $provider->id,
                        'status' => 'active',
                    ]
                );
                
                // Client 3 (for Admin view - minimum 3 clients)
                $clientUser3 = User::updateOrCreate(
                    ['email' => 'client3@demo.com'],
                    [
                        'name' => 'Carol Williams',
                        'password' => Hash::make('demo123'),
                        'role' => 'client',
                    ]
                );
                $client3 = Client::updateOrCreate(
                    ['email' => 'client3@demo.com'],
                    [
                        'user_id' => $clientUser3->id,
                        'name' => 'Carol Williams',
                        'phone' => '555-0103',
                        'location_id' => $location?->id,
                        'preferred_provider_id' => $provider->id,
                        'status' => 'active',
                    ]
                );
                
                $seeded[] = 'clients';
                Log::info('Seeded clients table', ['client_ids' => [$client1->id, $client2->id, $client3->id]]);
            } else {
                $client1 = Client::first();
                $client2 = Client::skip(1)->first() ?? $client1;
                $client3 = Client::skip(2)->first() ?? $client2;
            }
            
            // ============================================
            // STEP 8: Seed Appointments
            // Provider: 3 appointments for today (09:00, 11:00, 14:00)
            // Reception: Same appointments visible
            // ============================================
            if ($force || Appointment::query()->whereDate('start_time', today())->count() < 3) {
                $today = now()->startOfDay();
                $appointmentIds = [];
                
                // Create 3 appointments for today
                $hours = [9, 11, 14];
                foreach ($hours as $index => $hour) {
                    $client = ($index % 2 == 0) ? $client1 : $client2;
                    $start = $today->copy()->addHours($hour);
                    $end = $start->copy()->addMinutes($service1?->duration ?? 60);
                    
                    $appointment = Appointment::firstOrCreate(
                        [
                            'provider_id' => $provider->id,
                            'client_id' => $client->id,
                            'start_time' => $start,
                        ],
                        [
                            'location_id' => $location?->id,
                            'service_id' => ($index == 0) ? $service1?->id : $service2?->id,
                            'package_id' => null,
                            'end_time' => $end,
                            'status' => 'booked',
                            'notes' => "Appointment at {$hour}:00 (Auto-seeded)"
                        ]
                    );
                    $appointmentIds[] = $appointment->id;
                }
                
                $seeded[] = 'appointments';
                Log::info('Seeded appointments table', ['appointment_ids' => $appointmentIds, 'provider_id' => $provider->id]);
            }
            
            // Get first appointment for Provider-specific data
            $firstAppointment = Appointment::where('provider_id', $provider->id)->first();
            
            // ============================================
            // STEP 9: Seed Treatment (Provider-specific)
            // ============================================
            if ($firstAppointment && ($force || !Treatment::query()->where('appointment_id', $firstAppointment->id)->exists())) {
                $treatment = Treatment::firstOrCreate(
                    ['appointment_id' => $firstAppointment->id],
                    [
                        'provider_id' => $provider->id,
                        'treatment_type' => 'facial',
                        'cost' => 150.00,
                        'status' => 'completed',
                        'description' => 'Facial treatment session',
                        'treatment_date' => now(),
                        'notes' => 'Treatment completed successfully'
                    ]
                );
                $seeded[] = 'treatments';
                Log::info('Seeded treatments table', ['treatment_id' => $treatment->id]);
            }
            
            // ============================================
            // STEP 10: Seed Multiple Consent Forms (Provider-specific) - Real Database Data
            // ============================================
            $consentFormsCreated = [];
            if ($force || ConsentForm::query()->count() < 4) {
                // Ensure we have both clients and both services
                if ($client1 && $client2 && $service1 && $service2) {
                    // 1. Signed consent form (client1, service1) - Facial Treatment
                    $consent1 = ConsentForm::firstOrCreate(
                        [
                            'client_id' => $client1->id,
                            'service_id' => $service1->id,
                            'form_type' => 'consent',
                        ],
                        [
                            'digital_signature' => 'signed',
                            'date_signed' => now()->subDays(5),
                        ]
                    );
                    $consentFormsCreated[] = $consent1->id;
                    
                    // 2. Pending consent form (client2, service2) - Massage Therapy
                    $consent2 = ConsentForm::firstOrCreate(
                        [
                            'client_id' => $client2->id,
                            'service_id' => $service2->id,
                            'form_type' => 'consent',
                        ],
                        [
                            'digital_signature' => null, // Not signed yet
                            'date_signed' => null,
                        ]
                    );
                    $consentFormsCreated[] = $consent2->id;
                    
                    // 3. Signed consent form (client1, service2) - Different service
                    $consent3 = ConsentForm::firstOrCreate(
                        [
                            'client_id' => $client1->id,
                            'service_id' => $service2->id,
                            'form_type' => 'consent',
                        ],
                        [
                            'digital_signature' => 'signed',
                            'date_signed' => now()->subDays(10),
                        ]
                    );
                    $consentFormsCreated[] = $consent3->id;
                    
                    // 4. Expired consent form (client2, service1) - Signed but expired
                    $consent4 = ConsentForm::firstOrCreate(
                        [
                            'client_id' => $client2->id,
                            'service_id' => $service1->id,
                            'form_type' => 'consent',
                        ],
                        [
                            'digital_signature' => 'signed',
                            'date_signed' => now()->subDays(400), // Expired (over a year ago)
                        ]
                    );
                    $consentFormsCreated[] = $consent4->id;
                    
                    $seeded[] = 'consent_forms';
                    Log::info('Seeded consent forms table with multiple forms', [
                        'consent_ids' => $consentFormsCreated,
                        'count' => count($consentFormsCreated)
                    ]);
                } elseif ($client1 && $service1) {
                    // Fallback: create at least one consent form
                    $consent = ConsentForm::firstOrCreate(
                        [
                            'client_id' => $client1->id,
                            'service_id' => $service1->id,
                            'form_type' => 'consent',
                        ],
                        [
                            'digital_signature' => 'signed',
                            'date_signed' => now(),
                        ]
                    );
                    $seeded[] = 'consent_forms';
                    Log::info('Seeded consent forms table', ['consent_id' => $consent->id]);
                }
            }
            
            // ============================================
            // STEP 11: Seed Stock Adjustment (Provider Inventory)
            // ============================================
            if ($product1 && ($force || !StockAdjustment::query()->where('product_id', $product1->id)->exists())) {
                $stockAdj = StockAdjustment::firstOrCreate(
                    [
                        'product_id' => $product1->id,
                        'adjustment_type' => 'usage',
                    ],
                    [
                        'quantity' => -5,
                        'previous_stock' => $product1->stock,
                        'new_stock' => max(0, $product1->stock - 5),
                        'reason' => 'Product used during treatment',
                        'notes' => 'Stock adjustment for treatment session',
                        'adjusted_by' => $provider->id,
                    ]
                );
                $seeded[] = 'stock_adjustments';
                Log::info('Seeded stock adjustments table', ['adjustment_id' => $stockAdj->id]);
            }
            
            // ============================================
            // STEP 12: Seed Compliance Alert (Provider)
            // ============================================
            if ($force || !ComplianceAlert::query()->where('status', 'active')->exists()) {
                $compliance = ComplianceAlert::firstOrCreate(
                    [
                        'title' => 'Pending Treatment Documentation',
                        'status' => 'active',
                    ],
                    [
                        'description' => 'Treatment documentation needs review',
                        'type' => 'documentation',
                        'priority' => 'high',
                        'affected_items' => 1,
                        'due_date' => now()->addDays(7),
                        'category' => 'treatment',
                        'assigned_to' => $provider->id,
                    ]
                );
                $seeded[] = 'compliance_alerts';
                Log::info('Seeded compliance alerts table', ['alert_id' => $compliance->id]);
            }
            
            // ============================================
            // STEP 13: Seed Payments (Reception-specific)
            // ============================================
            $appointments = Appointment::where('provider_id', $provider->id)->limit(2)->get();
            if (($force || Payment::query()->count() < 2) && $appointments->count() >= 1) {
                $payment1 = Payment::firstOrCreate(
                    [
                        'client_id' => $client1->id,
                        'appointment_id' => $appointments[0]->id,
                    ],
                    [
                        'amount' => 150.00,
                        'payment_method' => 'cash',
                        'status' => 'completed',
                        'tips' => 20.00,
                        'commission' => 30.00,
                    ]
                );
                
                if ($appointments->count() >= 2) {
                    $payment2 = Payment::firstOrCreate(
                        [
                            'client_id' => $client2->id,
                            'appointment_id' => $appointments[1]->id,
                        ],
                        [
                            'amount' => 200.00,
                            'payment_method' => 'cash',
                            'status' => 'completed',
                            'tips' => 30.00,
                            'commission' => 40.00,
                        ]
                    );
                }
                
                $seeded[] = 'payments';
                Log::info('Seeded payments table', ['payment_ids' => [$payment1->id]]);
            }
            
            DB::commit();
            
            Log::info('✅ Database seeding completed successfully', [
                'seeded_tables' => $seeded,
                'provider_email' => 'provider@medispa.com',
                'reception_email' => 'reception@medispa.com',
            ]);
            
            return $seeded;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Database seeding failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return [];
        }
    }
}

