<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::firstOrCreate(['name'=>'client']);
        Role::firstOrCreate(['name'=>'provider']);
        Role::firstOrCreate(['name'=>'reception']);
        Role::firstOrCreate(['name'=>'admin']);
    }
}
