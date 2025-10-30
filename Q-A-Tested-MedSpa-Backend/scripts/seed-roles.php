<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Role;

$roles = ['admin','provider','reception','client'];
foreach ($roles as $name) {
    Role::firstOrCreate(['name' => $name]);
}

echo "Seeded roles: " . implode(', ', $roles) . PHP_EOL;


