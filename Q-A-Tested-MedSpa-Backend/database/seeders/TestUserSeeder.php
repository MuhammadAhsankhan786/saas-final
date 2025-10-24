<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Client;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create test client user
        $user = User::create([
            'name' => 'Test Client',
            'email' => 'client@medispa.com',
            'password' => bcrypt('demo123'),
            'role' => 'client',
        ]);

        // Create client profile
        Client::create([
            'user_id' => $user->id,
            'first_name' => 'Test',
            'last_name' => 'Client',
            'phone' => '123-456-7890',
            'date_of_birth' => '1990-01-01',
        ]);

        echo "Test user created: " . $user->email . "\n";
    }
}