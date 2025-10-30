<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Client;

$email = 'client@medispa.com';
$user = User::where('email', $email)->first();

if (!$user) {
    fwrite(STDERR, "User not found: $email\n");
    exit(1);
}

$client = Client::updateOrCreate(
    ['user_id' => $user->id],
    [
        'name' => $user->name ?? 'Client User',
        'email' => $user->email,
        'first_name' => $user->name ?? 'Client',
        'last_name' => 'User',
        'phone' => '1234567890',
        'date_of_birth' => '1995-01-01',
        'location_id' => 1,
    ]
);

echo json_encode([
    'user_id' => $user->id,
    'client_id' => $client->id,
], JSON_PRETTY_PRINT) . PHP_EOL;


