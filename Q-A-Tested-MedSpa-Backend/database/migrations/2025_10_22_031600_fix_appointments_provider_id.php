<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Drop the old staff_id column if it exists
            if (Schema::hasColumn('appointments', 'staff_id')) {
                $table->dropForeign(['staff_id']);
                $table->dropColumn('staff_id');
            }
            
            // Ensure provider_id exists and is properly configured
            if (!Schema::hasColumn('appointments', 'provider_id')) {
                $table->foreignId('provider_id')->nullable()->constrained('users')->onDelete('set null')->after('client_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Add back staff_id if needed
            $table->foreignId('staff_id')->constrained('users')->onDelete('cascade')->after('client_id');
            
            // Drop provider_id
            if (Schema::hasColumn('appointments', 'provider_id')) {
                $table->dropForeign(['provider_id']);
                $table->dropColumn('provider_id');
            }
        });
    }
};

