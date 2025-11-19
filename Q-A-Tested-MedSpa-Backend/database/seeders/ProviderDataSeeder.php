<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Client;
use App\Models\Appointment;
use App\Models\Treatment;
use App\Models\ConsentForm;
use App\Models\Service;
use App\Models\Location;
use App\Models\Product;
use App\Models\StockAdjustment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class ProviderDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * This seeder inserts comprehensive data for all provider role modules.
     */
    public function run(): void
    {
        echo "🌱 Seeding Complete Provider Data...\n\n";

        // Step 1: Get or create provider
        $provider = User::where('email', 'provider@pulse.com')->first();
        if (!$provider) {
            $provider = User::create([
                'name' => 'Provider User',
                'email' => 'provider@pulse.com',
                'password' => Hash::make('provider123'),
                'role' => 'provider',
            ]);
            echo "✅ Created provider user\n";
        } else {
            echo "✅ Found provider: {$provider->name} (ID: {$provider->id})\n";
        }

        // Step 2: Ensure location exists
        $location = Location::first();
        if (!$location) {
            $location = Location::create([
                'name' => 'Main Branch',
                'address' => '123 Main St',
                'city' => 'City',
                'state' => 'ST',
                'zip' => '12345',
                'phone' => '555-0100',
                'timezone' => 'UTC',
                'status' => 'active',
            ]);
            echo "✅ Created location\n";
        }

        // Step 3: Ensure services exist
        $services = Service::limit(5)->get();
        if ($services->isEmpty()) {
            $serviceData = [
                ['name' => 'Facial Treatment', 'price' => 150.00, 'duration' => 60, 'description' => 'Deep cleansing facial'],
                ['name' => 'Massage Therapy', 'price' => 120.00, 'duration' => 90, 'description' => 'Full body massage'],
                ['name' => 'Laser Hair Removal', 'price' => 250.00, 'duration' => 45, 'description' => 'Laser treatment'],
                ['name' => 'Chemical Peel', 'price' => 200.00, 'duration' => 60, 'description' => 'Chemical peel'],
                ['name' => 'Microdermabrasion', 'price' => 180.00, 'duration' => 45, 'description' => 'Microdermabrasion'],
            ];
            foreach ($serviceData as $svc) {
                Service::create($svc);
            }
            $services = Service::limit(5)->get();
            echo "✅ Created services\n";
        }

        // Step 4: Create/Get clients with appointments
        echo "\n📋 Creating Appointments & Clients...\n";
        $clients = $this->seedClientsAndAppointments($provider, $location, $services);
        echo "✅ Created {$clients->count()} client(s) with appointments\n";

        // Step 5: Create treatments (SOAP Notes)
        echo "\n💉 Creating Treatments (SOAP Notes)...\n";
        $treatments = $this->seedTreatments($provider, $clients, $services);
        echo "✅ Created {$treatments->count()} treatment(s) with SOAP notes\n";

        // Step 6: Create consent forms
        echo "\n📝 Creating Consent Forms...\n";
        $consents = $this->seedConsentForms($clients, $services);
        echo "✅ Created {$consents->count()} consent form(s)\n";

        // Step 7: Create inventory usage logs
        echo "\n📦 Creating Inventory Usage Logs...\n";
        $usageLogs = $this->seedInventoryUsage($provider);
        echo "✅ Created {$usageLogs->count()} inventory usage log(s)\n";

        echo "\n✅ Provider data seeding completed successfully!\n";
        echo "📊 Summary:\n";
        echo "   - Clients: {$clients->count()}\n";
        echo "   - Appointments: " . Appointment::where('provider_id', $provider->id)->count() . "\n";
        echo "   - Treatments: {$treatments->count()}\n";
        echo "   - Consent Forms: {$consents->count()}\n";
        echo "   - Inventory Usage: {$usageLogs->count()}\n";
    }

    /**
     * Seed clients and appointments for provider
     */
    private function seedClientsAndAppointments($provider, $location, $services)
    {
        $clients = collect();
        $today = now()->startOfDay();
        
        // Create 5-6 clients with appointments
        for ($i = 1; $i <= 6; $i++) {
            // Create client user
            $clientUser = User::firstOrCreate(
                ['email' => "providerclient{$i}@demo.com"],
                [
                    'name' => "Provider Client {$i}",
                    'password' => Hash::make('demo123'),
                    'role' => 'client',
                ]
            );

            // Create client record
            $client = Client::firstOrCreate(
                ['email' => "providerclient{$i}@demo.com"],
                [
                    'user_id' => $clientUser->id,
                    'name' => "Provider Client {$i}",
                    'phone' => "555-100{$i}",
                    'location_id' => $location->id,
                    'preferred_provider_id' => $provider->id,
                ]
            );
            $clients->push($client);

            // Create 2-3 appointments per client (today, tomorrow, next week)
            $appointmentDates = [
                $today->copy()->addHours(9 + ($i * 2)), // Today
                $today->copy()->addDay()->addHours(10 + ($i * 2)), // Tomorrow
                $today->copy()->addDays(7)->addHours(11 + ($i * 2)), // Next week
            ];

            foreach ($appointmentDates as $index => $startTime) {
                $service = $services[$index % $services->count()];
                $endTime = $startTime->copy()->addMinutes($service->duration ?? 60);
                
                $statuses = ['booked', 'completed', 'booked'];
                $status = $statuses[$index] ?? 'booked';

                Appointment::firstOrCreate(
                    [
                        'provider_id' => $provider->id,
                        'client_id' => $client->id,
                        'start_time' => $startTime,
                    ],
                    [
                        'appointment_time' => $startTime, // Legacy field
                        'location_id' => $location->id,
                        'service_id' => $service->id,
                        'end_time' => $endTime,
                        'status' => $status,
                        'notes' => "Appointment for {$client->name} - {$service->name}",
                    ]
                );
            }
        }

        return $clients;
    }

    /**
     * Seed treatments with SOAP notes
     */
    private function seedTreatments($provider, $clients, $services)
    {
        $treatments = collect();
        $appointments = Appointment::where('provider_id', $provider->id)
            ->where('status', 'completed')
            ->limit(10)
            ->get();

        if ($appointments->isEmpty()) {
            // Create some completed appointments first
            $appointments = Appointment::where('provider_id', $provider->id)
                ->limit(5)
                ->get();
            foreach ($appointments as $apt) {
                $apt->update(['status' => 'completed']);
            }
        }

        $soapNotesTemplates = [
            "Subjective: Patient reports improvement in skin texture. No adverse reactions noted.\n\nObjective: Skin appears smoother, reduced redness observed.\n\nAssessment: Treatment progressing well.\n\nPlan: Continue current regimen, schedule follow-up in 2 weeks.\n\nFollow-up: Monitor for any side effects.",
            "Subjective: Client satisfied with results. Minor sensitivity reported.\n\nObjective: Treatment area shows good response. Slight erythema present.\n\nAssessment: Normal post-treatment response.\n\nPlan: Apply soothing cream, avoid sun exposure.\n\nFollow-up: Recheck in 1 week.",
            "Subjective: Excellent results reported. No complaints.\n\nObjective: Significant improvement visible. Treatment area healing well.\n\nAssessment: Treatment successful.\n\nPlan: Continue maintenance schedule.\n\nFollow-up: Next appointment scheduled.",
        ];

        foreach ($appointments as $index => $appointment) {
            $service = $services[$index % $services->count()];
            $soapNotes = $soapNotesTemplates[$index % count($soapNotesTemplates)];

            $treatment = Treatment::firstOrCreate(
                ['appointment_id' => $appointment->id],
                [
                    'provider_id' => $provider->id,
                    'treatment_type' => $service->name,
                    'cost' => $service->price,
                    'status' => 'completed',
                    'description' => "Treatment completed for {$appointment->client->name}",
                    'notes' => $soapNotes,
                    'treatment_date' => Carbon::parse($appointment->start_time)->format('Y-m-d'),
                ]
            );
            $treatments->push($treatment);
        }

        return $treatments;
    }

    /**
     * Seed consent forms
     */
    private function seedConsentForms($clients, $services)
    {
        $consents = collect();
        $formTypes = ['consent', 'gfe', 'intake'];

        foreach ($clients as $clientIndex => $client) {
            // Create 2-3 consent forms per client
            for ($i = 0; $i < 3; $i++) {
                $service = $services[$i % $services->count()];
                $formType = $formTypes[$i % count($formTypes)];
                $isSigned = ($i % 2 == 0);

                $consent = ConsentForm::firstOrCreate(
                    [
                        'client_id' => $client->id,
                        'service_id' => $service->id,
                        'form_type' => $formType,
                    ],
                    [
                        'digital_signature' => $isSigned ? 'signed' : null,
                        'date_signed' => $isSigned ? Carbon::now()->subDays(rand(1, 30)) : null,
                        'file_url' => null,
                    ]
                );
                $consents->push($consent);
            }
        }

        return $consents;
    }

    /**
     * Seed inventory usage logs
     */
    private function seedInventoryUsage($provider)
    {
        $usageLogs = collect();
        $products = Product::limit(3)->get();

        if ($products->isEmpty()) {
            // Create products if none exist
            $productData = [
                ['name' => 'Botox 100 units', 'price' => 500.00, 'stock' => 50, 'category' => 'injectables', 'description' => 'Botox injection'],
                ['name' => 'Filler 1ml', 'price' => 600.00, 'stock' => 30, 'category' => 'injectables', 'description' => 'Dermal filler'],
                ['name' => 'Skincare Serum', 'price' => 80.00, 'stock' => 100, 'category' => 'skincare', 'description' => 'Premium serum'],
            ];
            foreach ($productData as $prod) {
                Product::create($prod);
            }
            $products = Product::limit(3)->get();
        }

        // Get some treatments to link usage to
        $treatments = Treatment::where('provider_id', $provider->id)->limit(5)->get();

        foreach ($treatments as $index => $treatment) {
            $product = $products[$index % $products->count()];
            $quantity = rand(1, 5);

            // Check if usage log already exists
            $exists = StockAdjustment::where('product_id', $product->id)
                ->where('user_id', $provider->id)
                ->exists();

            if (!$exists && $product->stock >= $quantity) {
                $previousStock = $product->stock;
                $newStock = max(0, $previousStock - $quantity);

                $usageLog = StockAdjustment::create([
                    'product_id' => $product->id,
                    'change' => -$quantity, // Table uses 'change' not 'quantity'
                    'previous_stock' => $previousStock,
                    'new_stock' => $newStock,
                    'reason' => "Product used for treatment #{$treatment->id}",
                    'user_id' => $provider->id, // Table uses 'user_id' not 'adjusted_by'
                ]);

                // Update product stock
                $product->update(['stock' => $newStock]);
                $usageLogs->push($usageLog);
            }
        }

        return $usageLogs;
    }
}

