<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Respect live mode flags; just run the LiveDataSeeder class directly
/** @var \Illuminate\Contracts\Container\Container $app */
$seeder = new \Database\Seeders\LiveDataSeeder();
$seeder->setContainer($app)->setCommand(app('Illuminate\\Console\\Command'));
$seeder->run();

echo "LiveDataSeeder completed" . PHP_EOL;


