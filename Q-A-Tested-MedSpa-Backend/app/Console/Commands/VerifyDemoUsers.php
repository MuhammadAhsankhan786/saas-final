<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class VerifyDemoUsers extends Command
{
    protected $signature = 'users:verify-demo';
    protected $description = 'Verify and fix demo users (admin, provider, reception, client) with @pulse.com emails and unique passwords';

    public function handle()
    {
        $this->info('🔍 Verifying demo users...');
        
        $requiredUsers = [
            [
                'email' => 'admin@pulse.com',
                'name' => 'Admin User',
                'role' => 'admin',
                'password' => 'admin123',
            ],
            [
                'email' => 'provider@pulse.com',
                'name' => 'Provider User',
                'role' => 'provider',
                'password' => 'provider123',
            ],
            [
                'email' => 'reception@pulse.com',
                'name' => 'Reception User',
                'role' => 'reception',
                'password' => 'reception123',
            ],
            [
                'email' => 'client@pulse.com',
                'name' => 'Client User',
                'role' => 'client',
                'password' => 'client123',
            ],
        ];

        $fixed = 0;
        $created = 0;
        $verified = 0;

        foreach ($requiredUsers as $userData) {
            $user = User::where('email', $userData['email'])->first();
            
            if (!$user) {
                // User doesn't exist - create it
                User::create([
                    'email' => $userData['email'],
                    'name' => $userData['name'],
                    'role' => $userData['role'],
                    'password' => Hash::make($userData['password']),
                ]);
                $this->info("✅ Created: {$userData['email']} ({$userData['role']})");
                $created++;
            } else {
                // User exists - verify and fix if needed
                $needsUpdate = false;
                $updates = [];

                // Check email
                if ($user->email !== $userData['email']) {
                    $updates['email'] = $userData['email'];
                    $needsUpdate = true;
                }

                // Check role
                if ($user->role !== $userData['role']) {
                    $updates['role'] = $userData['role'];
                    $needsUpdate = true;
                }

                // Check password (verify hash)
                if (!Hash::check($userData['password'], $user->password)) {
                    $updates['password'] = Hash::make($userData['password']);
                    $needsUpdate = true;
                }

                if ($needsUpdate) {
                    $user->update($updates);
                    $this->warn("🔧 Fixed: {$userData['email']} - Updated: " . implode(', ', array_keys($updates)));
                    $fixed++;
                } else {
                    $this->info("✅ Verified: {$userData['email']} ({$userData['role']}) - All correct");
                    $verified++;
                }
            }
        }

        // Summary
        $this->newLine();
        $this->info('📊 Summary:');
        $this->table(
            ['Status', 'Count'],
            [
                ['Created', $created],
                ['Fixed', $fixed],
                ['Verified (Correct)', $verified],
                ['Total', count($requiredUsers)],
            ]
        );

        // Final verification - show all demo users
        $this->newLine();
        $this->info('📋 Current Demo Users:');
        $demoUsers = User::whereIn('email', array_column($requiredUsers, 'email'))
            ->get(['email', 'name', 'role'])
            ->map(function ($u) {
                return [
                    'email' => $u->email,
                    'name' => $u->name,
                    'role' => $u->role,
                ];
            });

        $this->table(
            ['Email', 'Name', 'Role'],
            $demoUsers->toArray()
        );

        return 0;
    }
}
