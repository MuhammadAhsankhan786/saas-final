<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\ClientDataSeederController;

class SeedClientData extends Command
{
    protected $signature = 'client:seed {--force : Force seed even if data exists}';
    protected $description = 'Seed all data for client role (appointments, payments, packages, consents)';

    public function handle()
    {
        $this->info('🌱 Seeding client data...');
        
        $force = $this->option('force');
        $result = ClientDataSeederController::seedClientData($force);
        
        if ($result) {
            $this->info('✅ Client data seeded successfully!');
            $this->table(
                ['Item', 'Count'],
                [
                    ['Client ID', $result['client_id']],
                    ['Appointments', $result['appointments']],
                    ['Payments', $result['payments']],
                    ['Packages', $result['packages']],
                    ['Consents', $result['consents']],
                ]
            );
        } else {
            $this->error('❌ Failed to seed client data. Check logs for details.');
            return 1;
        }
        
        return 0;
    }
}
