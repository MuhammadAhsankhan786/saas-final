<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Appointment;
use App\Notifications\AppointmentCreated;

class TestNotificationCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'notify:test {user_id=1} {appointment_id=1}';

    /**
     * The console command description.
     */
    protected $description = 'Send test notification (SMS + Mail + DB) for a given user and appointment';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $userId = $this->argument('user_id');
        $appointmentId = $this->argument('appointment_id');

        $user = User::find($userId);
        $appointment = Appointment::find($appointmentId);

        if (! $user || ! $appointment) {
            $this->error("❌ User or Appointment not found.");
            return self::FAILURE;
        }

        $user->notify(new AppointmentCreated($appointment));

        $this->info("✅ Test notification sent to {$user->name} ({$user->phone})");

        return self::SUCCESS;
    }
}
