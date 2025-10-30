<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

$accounts = [
  ['email' => 'admin@medispa.com', 'role' => 'admin'],
  ['email' => 'provider@medispa.com', 'role' => 'provider'],
  ['email' => 'reception@medispa.com', 'role' => 'reception'],
  ['email' => 'client@medispa.com', 'role' => 'client'],
];

$results = [];

foreach ($accounts as $acc) {
    $email = $acc['email'];
    $role  = $acc['role'];
    $user = DB::table('users')->where('email', $email)->first();
    $exists = (bool) $user;
    $emailOk = $exists && $user->email === $email;
    $roleColOk = $exists && (property_exists($user, 'role') ? $user->role === $role : true);
    $passwordOk = $exists && Hash::check('demo123', $user->password);

    // role relationship checks (optional)
    $roleTableOk = (bool) DB::table('roles')->where('name', $role)->count();
    $roleUserOk = false;
    if ($exists && Schema::hasTable('role_user')) {
        $roleId = DB::table('roles')->where('name', $role)->value('id');
        if ($roleId) {
            $roleUserOk = (bool) DB::table('role_user')->where('user_id', $user->id)->where('role_id', $roleId)->count();
        }
    }

    // active/status column (optional)
    $activeOk = true;
    if ($exists && Schema::hasColumn('users', 'active')) {
        $activeOk = (bool) ($user->active ?? 1);
    } elseif ($exists && Schema::hasColumn('users', 'status')) {
        $activeOk = ($user->status ?? 'active') === 'active';
    }

    // Attempt JWT login via guard
    $token = null; $loginOk = false; $tokenRole = null;
    try {
        $token = auth('api')->attempt(['email'=>$email, 'password'=>'demo123']);
        $loginOk = (bool) $token;
        if ($loginOk) {
            // user role after login
            $tokenRole = auth('api')->user()->role ?? null;
        }
    } catch (Throwable $e) {
        $loginOk = false;
    }

    $results[] = [
        'email' => $email,
        'db_exists' => $exists,
        'email_match' => $emailOk,
        'password_bcrypt_demo123' => $passwordOk,
        'role_column' => $roleColOk,
        'role_in_roles' => $roleTableOk,
        'role_user_link' => $roleUserOk,
        'active_ok' => $activeOk,
        'login_ok' => $loginOk,
        'token_present' => (bool) $token,
        'token_user_role' => $tokenRole,
        'expected_role' => $role,
    ];
}

echo json_encode($results, JSON_PRETTY_PRINT) . PHP_EOL;


