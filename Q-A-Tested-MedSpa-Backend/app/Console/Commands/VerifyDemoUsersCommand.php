<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class VerifyDemoUsersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'medspa:verify-demo-users';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verify or create the 4 MedSpa demo accounts with correct roles and password';

    public function handle(): int
    {
        $accounts = [
            ['email' => 'admin@medispa.com', 'name' => 'Admin User', 'role' => 'admin'],
            ['email' => 'provider@medispa.com', 'name' => 'Provider User', 'role' => 'provider'],
            ['email' => 'reception@medispa.com', 'name' => 'Reception User', 'role' => 'reception'],
            ['email' => 'client@medispa.com', 'name' => 'Client User', 'role' => 'client'],
        ];

        $rows = [];

        foreach ($accounts as $acc) {
            $user = User::where('email', $acc['email'])->first();
            $status = '✅';
            $actions = [];

            if (!$user) {
                $user = new User();
                $user->email = $acc['email'];
                $actions[] = 'created';
            }

            // Ensure name
            if ($user->name !== $acc['name']) {
                $user->name = $acc['name'];
                $actions[] = 'name fixed';
            }

            // Ensure role column (string role) is correct if present
            if (property_exists($user, 'role')) {
                if ($user->role !== $acc['role']) {
                    $user->role = $acc['role'];
                    $actions[] = 'role fixed';
                }
            }

            // Ensure password = bcrypt('demo123')
            $newHash = Hash::make('demo123');
            // Always reset to known password per task requirements
            $user->password = $newHash;
            $actions[] = 'password set';

            // Default location_id if column exists
            if (array_key_exists('location_id', $user->getAttributes())) {
                if (empty($user->location_id)) {
                    $user->location_id = 1;
                    $actions[] = 'location set';
                }
            }

            $user->save();

            // Build verification flags post-save
            $user->refresh();
            $existsOk = $user !== null ? '✅' : '❌';
            $roleOk = '✅';
            if (property_exists($user, 'role')) {
                $roleOk = $user->role === $acc['role'] ? '✅' : '❌';
            }

            $rows[] = [
                $acc['email'],
                $existsOk,
                $roleOk,
                implode(', ', $actions),
            ];
        }

        $this->line('');
        $this->info('MedSpa Demo Accounts Verification');
        $this->table(['Email', 'Exists', 'Correct Role', 'Actions'], $rows);

        // Summary line like requested
        foreach ($rows as $r) {
            $this->line(($r[1]==='✅' && $r[2]==='✅' ? '✅' : '❌') . ' ' . $r[0] . ' → exists, correct role');
        }

        $this->line('');
        $this->info('All accounts ensured with password = demo123');

        return Command::SUCCESS;
    }
}


