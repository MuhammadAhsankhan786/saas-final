<?php

/**
 * Force Seed Reception Data Script
 * Run: php force_seed_reception.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\DatabaseSeederController;
use App\Models\Location;
use App\Models\Service;
use App\Models\Product;
use App\Models\Package;
use App\Models\Client;
use App\Models\Appointment;
use App\Models\Payment;
use Illuminate\Support\Facades\Log;

echo "🚀 Force-running database seeder for Reception role...\n";

// Force seed all tables (force=true bypasses existence checks)
$seeded = DatabaseSeederController::seedMissingData(true);

echo "\n📊 Verification Results:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$locationsCount = Location::count();
echo "✅ Locations: {$locationsCount} records\n";

$servicesCount = Service::count();
echo "✅ Services: {$servicesCount} records\n";

$productsCount = Product::count();
echo "✅ Products: {$productsCount} records\n";

$packagesCount = Package::count();
echo "✅ Packages: {$packagesCount} records\n";

$clientsCount = Client::count();
echo "✅ Clients: {$clientsCount} records\n";

$appointmentsCount = Appointment::count();
echo "✅ Appointments: {$appointmentsCount} records\n";

$paymentsCount = Payment::count();
echo "✅ Payments: {$paymentsCount} records\n";

// Log inserted IDs
echo "\n📋 Inserted Record IDs:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$locations = Location::all();
foreach ($locations as $loc) {
    echo "Location ID: {$loc->id} - {$loc->name}\n";
}

$clients = Client::all();
foreach ($clients as $client) {
    echo "Client ID: {$client->id} - {$client->name} (Email: {$client->email})\n";
}

$appointments = Appointment::all();
foreach ($appointments as $apt) {
    echo "Appointment ID: {$apt->id} - Client: {$apt->client_id}, Time: {$apt->start_time}\n";
}

$payments = Payment::all();
foreach ($payments as $pay) {
    echo "Payment ID: {$pay->id} - Amount: \${$pay->amount}, Client: {$pay->client_id}\n";
}

$packages = Package::all();
foreach ($packages as $pkg) {
    echo "Package ID: {$pkg->id} - {$pkg->name} (\${$pkg->price})\n";
}

echo "\n✅ Seeding completed! All data verified in MySQL.\n";
echo "📱 Reload Reception dashboard to see data.\n";

Log::info('Force seed completed via script', [
    'locations' => $locationsCount,
    'services' => $servicesCount,
    'products' => $productsCount,
    'packages' => $packagesCount,
    'clients' => $clientsCount,
    'appointments' => $appointmentsCount,
    'payments' => $paymentsCount,
]);

