<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Fix AUTO_INCREMENT for client_packages table
        // First ensure id is primary key, then add AUTO_INCREMENT
        DB::statement('ALTER TABLE `client_packages` MODIFY `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY');
    }

    public function down(): void
    {
        // Revert AUTO_INCREMENT (not recommended but for rollback)
        DB::statement('ALTER TABLE `client_packages` MODIFY `id` BIGINT UNSIGNED NOT NULL');
    }
};
