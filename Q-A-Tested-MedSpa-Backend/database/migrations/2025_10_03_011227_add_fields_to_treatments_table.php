<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('treatments', function (Blueprint $table) {
            // Add only if missing to avoid duplicate column errors in production
            if (!Schema::hasColumn('treatments', 'description')) {
                $table->text('description')->nullable()->after('status');
            }
            if (!Schema::hasColumn('treatments', 'treatment_date')) {
                $table->dateTime('treatment_date')->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('treatments', function (Blueprint $table) {
            if (Schema::hasColumn('treatments', 'treatment_date')) {
                $table->dropColumn('treatment_date');
            }
            if (Schema::hasColumn('treatments', 'description')) {
                $table->dropColumn('description');
            }
        });
    }
};
