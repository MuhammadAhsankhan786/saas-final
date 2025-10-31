<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $liveData = (bool) env('MEDSPA_LIVE_DATA', false) || (bool) env('MEDSPA_DISABLE_DEMO_SEED', false);

        if ($liveData) {
            // Live-data mode: only ensure roles exist; do not insert demo/sample data
            $this->call([
                RoleSeeder::class,
            ]);
            return;
        }

        // Demo/data-rich mode: seed baseline demo data and accounts
        $this->call([
            RoleSeeder::class,
            AdminDashboardSeeder::class,
            ProviderSeeder::class,
            ClientDataSeeder::class,
            // TestDataSeeder::class, // Temporarily disabled due to staff_id column issue
            ComplianceAlertsTableSeeder::class,
        ]);

        // Ensure the 4 demo users exist with password demo123
        User::updateOrCreate(
            ['email' => 'admin@medispa.com'],
            ['name' => 'Admin User', 'password' => bcrypt('demo123'), 'role' => 'admin']
        );
        User::updateOrCreate(
            ['email' => 'provider@medispa.com'],
            ['name' => 'Provider User', 'password' => bcrypt('demo123'), 'role' => 'provider']
        );
        User::updateOrCreate(
            ['email' => 'reception@medispa.com'],
            ['name' => 'Reception User', 'password' => bcrypt('demo123'), 'role' => 'reception']
        );
        User::updateOrCreate(
            ['email' => 'client@medispa.com'],
            ['name' => 'Client User', 'password' => bcrypt('demo123'), 'role' => 'client']
        );
    }
}
