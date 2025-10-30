<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

$accounts = [
  ['email' => 'admin@medispa.com', 'name' => 'Admin User', 'role' => 'admin'],
  ['email' => 'provider@medispa.com', 'name' => 'Provider User', 'role' => 'provider'],
  ['email' => 'reception@medispa.com', 'name' => 'Reception User', 'role' => 'reception'],
  ['email' => 'client@medispa.com', 'name' => 'Client User', 'role' => 'client'],
];

$created = [];
foreach ($accounts as $acc) {
    $payload = [
        'name' => $acc['name'],
        'password' => Hash::make('demo123'),
        'role' => $acc['role'],
        'updated_at' => now(),
    ];
    if (!DB::table('users')->where('email', $acc['email'])->exists()) {
        $payload['created_at'] = now();
    }
    DB::table('users')->updateOrInsert(['email' => $acc['email']], $payload);
    $created[] = $acc['email'];
}

echo json_encode(['ensured'=>$created], JSON_PRETTY_PRINT) . PHP_EOL;


