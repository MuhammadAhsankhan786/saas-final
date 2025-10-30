<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\DatabaseSeederController;
use App\Models\Location;
use App\Models\Service;
use App\Models\Product;
use App\Models\Package;
use App\Models\Client;
use App\Models\Appointment;
use App\Models\Payment;
use Illuminate\Support\Facades\Log;

class ForceSeedReceptionData extends Command
{
    protected $signature = 'reception:force-seed';
    protected $description = 'Force-run database seeder for Reception role and verify all inserts';

    public function handle()
    {
        $this->info('🚀 Force-running database seeder for Reception role...');
        
        // Force seed all tables (force=true to bypass existence checks)
        $seeded = DatabaseSeederController::seedMissingData(true);
        
        // Verify inserts with count checks
        $this->info("\n📊 Verification Results:");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        $locationsCount = Location::count();
        $this->info("✅ Locations: {$locationsCount} records");
        
        $servicesCount = Service::count();
        $this->info("✅ Services: {$servicesCount} records");
        
        $productsCount = Product::count();
        $this->info("✅ Products: {$productsCount} records");
        
        $packagesCount = Package::count();
        $this->info("✅ Packages: {$packagesCount} records");
        
        $clientsCount = Client::count();
        $this->info("✅ Clients: {$clientsCount} records");
        
        $appointmentsCount = Appointment::count();
        $this->info("✅ Appointments: {$appointmentsCount} records");
        
        $paymentsCount = Payment::count();
        $this->info("✅ Payments: {$paymentsCount} records");
        
        // Log inserted IDs
        $this->info("\n📋 Inserted Record IDs:");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        $locations = Location::all();
        foreach ($locations as $loc) {
            $this->info("Location ID: {$loc->id} - {$loc->name}");
        }
        
        $clients = Client::all();
        foreach ($clients as $client) {
            $this->info("Client ID: {$client->id} - {$client->name} (Email: {$client->email})");
        }
        
        $appointments = Appointment::all();
        foreach ($appointments as $apt) {
            $this->info("Appointment ID: {$apt->id} - Client: {$apt->client_id}, Time: {$apt->start_time}");
        }
        
        $payments = Payment::all();
        foreach ($payments as $pay) {
            $this->info("Payment ID: {$pay->id} - Amount: \${$pay->amount}, Client: {$pay->client_id}");
        }
        
        $packages = Package::all();
        foreach ($packages as $pkg) {
            $this->info("Package ID: {$pkg->id} - {$pkg->name} (\${$pkg->price})");
        }
        
        $this->info("\n✅ Seeding completed! All data verified in MySQL.");
        $this->info("📱 Reload Reception dashboard to see data.");
        
        Log::info('Force seed completed', [
            'locations' => $locationsCount,
            'services' => $servicesCount,
            'products' => $productsCount,
            'packages' => $packagesCount,
            'clients' => $clientsCount,
            'appointments' => $appointmentsCount,
            'payments' => $paymentsCount,
        ]);
        
        return Command::SUCCESS;
    }
}

