<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            if (Schema::hasTable('packages') && Schema::hasColumn('services', 'package_id')) {
                $table->foreign('package_id')->references('id')->on('packages')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            if (Schema::hasColumn('services', 'package_id')) {
                $table->dropForeign(['package_id']);
            }
        });
    }
};


