<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ConsentForm;
use App\Models\Client;
use App\Models\Service;
use App\Models\User;
use App\Models\Appointment;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ConsentFormSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "🌱 Seeding Consent Forms for Provider...\n";

        // Get provider user
        $provider = User::where('email', 'provider@medispa.com')->first();
        
        if (!$provider) {
            echo "❌ Provider user not found. Please ensure provider@medispa.com exists.\n";
            return;
        }

        echo "✅ Found provider: {$provider->name} (ID: {$provider->id})\n";

        // Get provider's clients (those with appointments)
        $clients = Client::whereHas('appointments', function ($q) use ($provider) {
            $q->where('provider_id', $provider->id);
        })->get();

        if ($clients->isEmpty()) {
            echo "⚠️ No clients found with appointments for provider. Creating appointments first...\n";
            
            // Try to seed appointments first
            $this->seedAppointmentsForProvider($provider);
            
            // Retry getting clients
            $clients = Client::whereHas('appointments', function ($q) use ($provider) {
                $q->where('provider_id', $provider->id);
            })->get();
        }

        if ($clients->isEmpty()) {
            echo "❌ Still no clients found. Cannot seed consent forms.\n";
            return;
        }

        echo "✅ Found {$clients->count()} client(s) with appointments\n";

        // Get services
        $services = Service::limit(3)->get();
        
        if ($services->isEmpty()) {
            echo "⚠️ No services found. Creating default services...\n";
            $this->seedServices();
            $services = Service::limit(3)->get();
        }

        if ($services->isEmpty()) {
            echo "❌ No services available. Cannot seed consent forms.\n";
            return;
        }

        echo "✅ Found {$services->count()} service(s)\n";

        // Form types
        $formTypes = ['consent', 'gfe', 'intake'];
        
        $consentFormsCreated = 0;

        // Create consent forms for each client
        foreach ($clients as $clientIndex => $client) {
            echo "📝 Creating consent forms for client: {$client->name} (ID: {$client->id})\n";
            
            // Create 2-3 consent forms per client
            for ($i = 0; $i < 3; $i++) {
                $service = $services[$i % $services->count()];
                $formType = $formTypes[$i % count($formTypes)];
                
                // Check if consent form already exists
                $exists = ConsentForm::where('client_id', $client->id)
                    ->where('service_id', $service->id)
                    ->where('form_type', $formType)
                    ->exists();
                
                if ($exists) {
                    echo "  ⏭️  Consent form already exists for {$client->name} - {$service->name} - {$formType}\n";
                    continue;
                }
                
                // Create signed or pending consent form
                $isSigned = ($i % 2 == 0); // Alternate between signed and pending
                
                $consentForm = ConsentForm::create([
                    'client_id' => $client->id,
                    'service_id' => $service->id,
                    'form_type' => $formType,
                    'digital_signature' => $isSigned ? 'signed' : null,
                    'date_signed' => $isSigned ? Carbon::now()->subDays(rand(1, 30)) : null,
                    'file_url' => null,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
                
                $consentFormsCreated++;
                $status = $isSigned ? '✅ Signed' : '⏳ Pending';
                echo "  {$status} - Created consent form: {$formType} for {$service->name} (ID: {$consentForm->id})\n";
            }
        }

        echo "\n✅ Successfully created {$consentFormsCreated} consent form(s) for provider!\n";
        Log::info('ConsentFormSeeder completed', [
            'provider_id' => $provider->id,
            'consent_forms_created' => $consentFormsCreated
        ]);
    }

    /**
     * Seed appointments for provider if none exist
     */
    private function seedAppointmentsForProvider($provider)
    {
        $clients = Client::limit(2)->get();
        $services = Service::limit(2)->get();
        $location = \App\Models\Location::first();

        if ($clients->isEmpty() || $services->isEmpty()) {
            echo "❌ Cannot create appointments: missing clients or services\n";
            return;
        }

        $today = now()->startOfDay();
        $hours = [9, 11, 14];

        foreach ($hours as $index => $hour) {
            $client = $clients[$index % $clients->count()];
            $service = $services[$index % $services->count()];
            $start = $today->copy()->addHours($hour);
            $end = $start->copy()->addMinutes($service->duration ?? 60);

            Appointment::firstOrCreate(
                [
                    'provider_id' => $provider->id,
                    'client_id' => $client->id,
                    'start_time' => $start,
                ],
                [
                    'location_id' => $location?->id,
                    'service_id' => $service->id,
                    'end_time' => $end,
                    'status' => 'booked',
                    'notes' => "Auto-seeded appointment for consent forms",
                ]
            );
        }

        echo "✅ Created appointments for provider\n";
    }

    /**
     * Seed services if none exist
     */
    private function seedServices()
    {
        $services = [
            [
                'name' => 'Facial Treatment',
                'description' => 'Deep cleansing facial treatment',
                'category' => 'Facial',
                'price' => 150.00,
                'duration' => 60,
                'active' => true,
            ],
            [
                'name' => 'Massage Therapy',
                'description' => 'Relaxing full-body massage',
                'category' => 'Massage',
                'price' => 120.00,
                'duration' => 90,
                'active' => true,
            ],
            [
                'name' => 'Laser Hair Removal',
                'description' => 'Advanced laser hair removal',
                'category' => 'Laser',
                'price' => 250.00,
                'duration' => 45,
                'active' => true,
            ],
        ];

        foreach ($services as $serviceData) {
            Service::firstOrCreate(
                ['name' => $serviceData['name']],
                $serviceData
            );
        }

        echo "✅ Created default services\n";
    }
}

