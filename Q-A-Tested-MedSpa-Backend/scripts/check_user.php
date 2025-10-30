<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$email = $argv[1] ?? null;
if (!$email) { fwrite(STDERR, "Usage: php scripts/check_user.php <email>\n"); exit(1); }

$u = User::where('email', $email)->first();
if (!$u) { echo "not_found\n"; exit(0); }
echo "found:{$u->email}\n";
echo (Hash::check('demo123', $u->password) ? 'password_ok' : 'password_bad') . "\n";
echo 'role=' . ($u->role ?? 'N/A') . "\n";


