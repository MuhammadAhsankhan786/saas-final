<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AuditLog;
use App\Models\User;
use Carbon\Carbon;

class AuditLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get admin user
        $admin = User::where('role', 'admin')->first();
        if (!$admin) {
            $this->command->warn('No admin user found. Please create an admin user first.');
            return;
        }

        // Get other users for variety
        $users = User::take(5)->get();
        if ($users->isEmpty()) {
            $users = collect([$admin]);
        }

        $actions = ['create', 'update', 'delete', 'login', 'logout'];
        $tables = ['users', 'appointments', 'clients', 'packages', 'services', 'locations', 'payments', 'treatments', 'consent_forms'];

        $auditLogs = [];

        // Generate logs for the past 30 days
        for ($i = 0; $i < 50; $i++) {
            $user = $users->random();
            $action = $actions[array_rand($actions)];
            $table = $tables[array_rand($tables)];
            $recordId = rand(1, 100);
            
            // Create timestamp within last 30 days
            $daysAgo = rand(0, 30);
            $hoursAgo = rand(0, 23);
            $minutesAgo = rand(0, 59);
            $createdAt = Carbon::now()->subDays($daysAgo)->subHours($hoursAgo)->subMinutes($minutesAgo);

            $oldData = null;
            $newData = null;

            if ($action === 'update') {
                $oldData = ['status' => 'active', 'name' => 'Old Name'];
                $newData = ['status' => 'inactive', 'name' => 'New Name'];
            } elseif ($action === 'create') {
                $newData = ['name' => 'New Record', 'status' => 'active', 'created_by' => $user->id];
            } elseif ($action === 'delete') {
                $oldData = ['id' => $recordId, 'name' => 'Deleted Record'];
            }

            $auditLogs[] = [
                'user_id' => $user->id,
                'action' => $action,
                'table_name' => $table,
                'record_id' => $recordId,
                'old_data' => $oldData ? json_encode($oldData) : null,
                'new_data' => $newData ? json_encode($newData) : null,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];
        }

        // Insert in batches
        foreach (array_chunk($auditLogs, 10) as $chunk) {
            AuditLog::insert($chunk);
        }

        $this->command->info('Created ' . count($auditLogs) . ' audit logs.');
    }
}
