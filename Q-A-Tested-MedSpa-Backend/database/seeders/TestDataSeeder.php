<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Client;
use App\Models\Appointment;
use App\Models\Treatment;
use App\Models\Service;
use App\Models\ConsentForm;

class TestDataSeeder extends Seeder
{
    public function run()
    {
        // 1️⃣ Ensure Provider & Client exist
        $provider = User::firstOrCreate(
            ['email' => 'provider@medispa.com'],
            ['name' => 'Test Provider', 'password' => bcrypt('demo123'), 'role' => 'provider']
        );

        $clientUser = User::firstOrCreate(
            ['email' => 'client@medispa.com'],
            ['name' => 'Test Client', 'password' => bcrypt('demo123'), 'role' => 'client']
        );

        $client = Client::firstOrCreate(
            ['user_id' => $clientUser->id],
            [
                'phone' => '+1234567890',
                'name' => $clientUser->name,    // Add required name field
                'email' => $clientUser->email,  // Add required email field
                'location_id' => 1              // Add required location_id
            ]
        );

        // 2️⃣ Appointment
        $appointment = Appointment::firstOrCreate(
            ['client_id' => $client->id, 'staff_id' => $provider->id],
            ['location_id' => 1, 'appointment_time' => now()->addDay(), 'status' => 'pending']
        );

        // 3️⃣ Service
        $service = Service::firstOrCreate(
            ['name' => 'Facial Treatment'],
            ['category' => 'Facial', 'description' => 'Relaxing facial', 'price' => 100]
        );

        // 4️⃣ Treatment
        $treatment = Treatment::firstOrCreate(
            ['appointment_id' => $appointment->id, 'provider_id' => $provider->id],
            [
                'patient_id' => $client->id,
                'treatment_type' => 'Facial Session',
                'cost' => 100,
                'status' => 'pending',
                'description' => 'Relaxing facial treatment',
                'treatment_date' => now()
            ]
        );

        // 5️⃣ Consent Form
        $consentForm = ConsentForm::firstOrCreate(
            ['client_id' => $client->id, 'service_id' => $service->id],
            ['form_type' => 'consent', 'digital_signature' => 'Signed', 'date_signed' => now()]
        );
    }
}
