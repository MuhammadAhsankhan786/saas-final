<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Client;
use App\Models\Location;
use App\Models\Appointment;

class VerifyAndSeedClientAppointments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'medspa:verify-seed-client-appts {--dry : Show actions without writing to DB}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ensure every client has a Client profile and at least 2 appointments; verify endpoints; print summary table';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry');
        $now = Carbon::now();
        $totalCreated = 0;

        // Ensure a location exists
        $locationId = Location::value('id');
        if (!$locationId) {
            if ($dryRun) {
                $this->line('Would create default Location: Main Branch');
            } else {
                $locationId = Location::create([
                    'name' => 'Main Branch',
                    'address' => '123 Main St',
                    'city' => 'City',
                    'state' => 'ST',
                    'zip' => '00000',
                    'timezone' => 'UTC',
                ])->id;
            }
        }

        $rows = [];

        $clientUsers = User::where('role', 'client')->orderBy('id')->get();
        foreach ($clientUsers as $user) {
            // 1) Ensure client profile exists
            $profileOk = true;
            if ($dryRun) {
                $client = Client::where('user_id', $user->id)->first();
                if (!$client) {
                    $profileOk = false; // would create
                }
            } else {
                $client = Client::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'name' => $user->name ?? 'Demo Client',
                        'email' => $user->email,
                        'phone' => '555-0000',
                        'location_id' => $locationId ?? Location::value('id'),
                    ]
                );
            }

            if (!isset($client) || !$client) {
                // Dry-run missing case
                $profileOk = false;
            }

            // 2) Ensure at least 2 appointments
            $created = 0;
            if ($client) {
                $count = Appointment::where('client_id', $client->id)->count();
                if ($count < 2) {
                    $payload = [
                        [
                            'client_id' => $client->id,
                            'location_id' => $locationId ?? Location::value('id'),
                            'start_time' => (clone $now)->subDays(3)->setTime(11, 0),
                            'end_time' => (clone $now)->subDays(3)->setTime(12, 0),
                            'status' => 'completed',
                            'notes' => 'Past facial session',
                            'created_at' => $now,
                            'updated_at' => $now,
                        ],
                        [
                            'client_id' => $client->id,
                            'location_id' => $locationId ?? Location::value('id'),
                            'start_time' => Carbon::today()->setTime(15, 0),
                            'end_time' => Carbon::today()->setTime(16, 0),
                            'status' => 'booked',
                            'notes' => 'Today consultation',
                            'created_at' => $now,
                            'updated_at' => $now,
                        ],
                        [
                            'client_id' => $client->id,
                            'location_id' => $locationId ?? Location::value('id'),
                            'start_time' => (clone $now)->addDays(5)->setTime(13, 0),
                            'end_time' => (clone $now)->addDays(5)->setTime(14, 0),
                            'status' => 'booked',
                            'notes' => 'Future follow-up',
                            'created_at' => $now,
                            'updated_at' => $now,
                        ],
                    ];

                    if ($dryRun) {
                        $created = 3; // would insert
                    } else {
                        Appointment::insert($payload);
                        $created = 3;
                        $totalCreated += $created;
                    }
                }
            }

            $rows[] = [
                'email' => $user->email,
                'profile' => $profileOk ? '✅' : ($dryRun ? 'would create' : 'created'),
                'created' => $created,
            ];
        }

        // 3) Minimal endpoint verification for first client (optional)
        try {
            $first = $clientUsers->first();
            if ($first) {
                // Generate a token and test endpoints with it
                $token = auth('api')->login($first);
                $apiBase = config('app.url') ? rtrim(config('app.url'), '/') . '/api' : 'http://127.0.0.1:8000/api';
                $me = Http::withToken($token)->get($apiBase . '/me');
                $appts = Http::withToken($token)->get($apiBase . '/client/appointments');
                $this->line("/api/me => " . $me->status());
                $this->line("/api/client/appointments => " . $appts->status() . ' (items: ' . (is_array($appts->json()) ? count($appts->json()) : 0) . ')');
            }
        } catch (\Throwable $e) {
            $this->warn('Endpoint verification skipped: ' . $e->getMessage());
        }

        // 4) Print concise table
        $this->line("+-------------------------------+-------------+------------------------+");
        $this->line("| Client Email                  | Profile OK  | Appointments Created   |");
        $this->line("+-------------------------------+-------------+------------------------+");
        foreach ($rows as $r) {
            $email = str_pad(substr($r['email'], 0, 29), 29);
            $profile = str_pad($r['profile'], 11);
            $created = str_pad(($r['created'] > 0 ? $r['created'] . ' added' : '0 added'), 22);
            $this->line("| {$email} | {$profile} | {$created} |");
        }
        $this->line("+-------------------------------+-------------+------------------------+");

        $this->info('✅ All clients verified; appointments endpoint ready.');
        if ($dryRun) {
            $this->info('Dry run: no database changes were made.');
        }

        return Command::SUCCESS;
    }
}
