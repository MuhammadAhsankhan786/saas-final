<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

$now = Carbon::now();
$filled = [];
$targets = ['client_packages','failed_jobs','invoices','jobs','job_batches','location_staff'];

// Helper pickers
$clientIds = DB::table('clients')->pluck('id')->toArray();
$clientUserIds = DB::table('users')->where('role','client')->pluck('id')->toArray();
$packageIds = DB::table('packages')->pluck('id')->toArray();
$patientIds = DB::table('patients')->pluck('id')->toArray();
$locationIds = DB::table('locations')->pluck('id')->toArray();
$staffIds = DB::table('staff')->pluck('id')->toArray();

foreach ($targets as $table) {
    $count = 0;
    try { $count = DB::table($table)->count(); } catch (Throwable $e) { continue; }
    if ($count > 0) continue;

    switch ($table) {
        case 'client_packages':
            if (!$clientIds || !$packageIds) break;
            for ($i=0;$i<5;$i++) {
                DB::table('client_packages')->insertOrIgnore([
                    'client_id' => $clientIds[$i % count($clientIds)],
                    'package_id' => $packageIds[$i % count($packageIds)],
                    'assigned_at' => $now->copy()->subDays($i),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
            $filled[] = 'client_packages';
            break;
        case 'invoices':
            if (!$patientIds) break;
            for ($i=0;$i<5;$i++) {
                DB::table('invoices')->insert([
                    'patient_id' => $patientIds[$i % count($patientIds)],
                    'amount' => 100 + ($i*25),
                    'invoice_date' => $now->copy()->subDays($i)->toDateString(),
                    'status' => 'unpaid',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
            $filled[] = 'invoices';
            break;
        case 'location_staff':
            if (!$locationIds || !$staffIds) break;
            for ($i=0;$i<5;$i++) {
                DB::table('location_staff')->insert([
                    'staff_id' => $staffIds[$i % count($staffIds)],
                    'location_id' => $locationIds[$i % count($locationIds)],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
            $filled[] = 'location_staff';
            break;
        case 'jobs':
            for ($i=0;$i<5;$i++) {
                DB::table('jobs')->insert([
                    'queue' => 'default',
                    'payload' => json_encode(['job' => 'noop', 'i'=>$i]),
                    'attempts' => 0,
                    'reserved_at' => null,
                    'available_at' => time(),
                    'created_at' => time(),
                ]);
            }
            $filled[] = 'jobs';
            break;
        case 'job_batches':
            for ($i=0;$i<5;$i++) {
                DB::table('job_batches')->insert([
                    'id' => 'batch_'.uniqid(),
                    'name' => 'Live Batch '.$i,
                    'total_jobs' => 1,
                    'pending_jobs' => 1,
                    'failed_jobs' => 0,
                    'failed_job_ids' => json_encode([]),
                    'options' => null,
                    'cancelled_at' => null,
                    'created_at' => time(),
                    'finished_at' => null,
                ]);
            }
            $filled[] = 'job_batches';
            break;
        case 'failed_jobs':
            for ($i=0;$i<5;$i++) {
                DB::table('failed_jobs')->insert([
                    'uuid' => (string) Str::uuid(),
                    'connection' => 'mysql',
                    'queue' => 'default',
                    'payload' => json_encode(['job' => 'failed', 'i'=>$i]),
                    'exception' => 'Simulated failure for log visibility',
                    'failed_at' => $now,
                ]);
            }
            $filled[] = 'failed_jobs';
            break;
    }
}

echo json_encode(['filled'=>$filled,'total_added'=>count($filled)*5], JSON_PRETTY_PRINT).PHP_EOL;


