<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$tables = ['users','roles','clients','appointments','payments','services','treatments','consent_forms','products'];
$out = [];
foreach ($tables as $t) {
    try {
        $count = DB::table($t)->count();
        $out[$t] = $count;
    } catch (Throwable $e) {
        $out[$t] = 'missing';
    }
}
echo json_encode($out, JSON_PRETTY_PRINT) . PHP_EOL;


