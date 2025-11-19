<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;
use Carbon\Carbon;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "🌱 Seeding Services...\n";

        $services = [
            [
                'name' => 'Facial Treatment',
                'description' => 'Deep cleansing facial treatment with exfoliation and hydration',
                'category' => 'Facial',
                'price' => 150.00,
                'duration' => 60,
                'active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Massage Therapy',
                'description' => 'Relaxing full-body massage therapy session',
                'category' => 'Massage',
                'price' => 120.00,
                'duration' => 90,
                'active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Laser Hair Removal',
                'description' => 'Advanced laser hair removal treatment for smooth skin',
                'category' => 'Laser',
                'price' => 250.00,
                'duration' => 45,
                'active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Chemical Peel',
                'description' => 'Professional chemical peel for skin rejuvenation',
                'category' => 'Facial',
                'price' => 200.00,
                'duration' => 60,
                'active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Microdermabrasion',
                'description' => 'Exfoliating microdermabrasion treatment for brighter skin',
                'category' => 'Facial',
                'price' => 180.00,
                'duration' => 45,
                'active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Botox Injection',
                'description' => 'Anti-aging Botox injection treatment',
                'category' => 'Injectables',
                'price' => 400.00,
                'duration' => 30,
                'active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Dermal Fillers',
                'description' => 'Dermal filler injection for volume restoration',
                'category' => 'Injectables',
                'price' => 600.00,
                'duration' => 45,
                'active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Laser Skin Resurfacing',
                'description' => 'Advanced laser treatment for skin resurfacing and rejuvenation',
                'category' => 'Laser',
                'price' => 500.00,
                'duration' => 90,
                'active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'HydraFacial',
                'description' => 'HydraFacial deep cleansing and hydration treatment',
                'category' => 'Facial',
                'price' => 175.00,
                'duration' => 60,
                'active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Body Contouring',
                'description' => 'Non-invasive body contouring treatment',
                'category' => 'Body',
                'price' => 350.00,
                'duration' => 60,
                'active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'LED Light Therapy',
                'description' => 'Therapeutic LED light treatment for skin health',
                'category' => 'Facial',
                'price' => 100.00,
                'duration' => 30,
                'active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Acne Treatment',
                'description' => 'Professional acne treatment and extraction',
                'category' => 'Facial',
                'price' => 130.00,
                'duration' => 45,
                'active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Waxing Service',
                'description' => 'Full body or targeted area waxing service',
                'category' => 'Hair Removal',
                'price' => 80.00,
                'duration' => 30,
                'active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Eyebrow Threading',
                'description' => 'Precise eyebrow shaping with threading technique',
                'category' => 'Hair Removal',
                'price' => 25.00,
                'duration' => 15,
                'active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Skin Consultation',
                'description' => 'Comprehensive skin analysis and consultation',
                'category' => 'Consultation',
                'price' => 75.00,
                'duration' => 30,
                'active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        foreach ($services as $serviceData) {
            Service::updateOrCreate(
                ['name' => $serviceData['name']],
                $serviceData
            );
            echo "✅ Created/Updated service: {$serviceData['name']}\n";
        }

        echo "✅ Services seeded successfully! Total: " . Service::count() . "\n";
    }
}

