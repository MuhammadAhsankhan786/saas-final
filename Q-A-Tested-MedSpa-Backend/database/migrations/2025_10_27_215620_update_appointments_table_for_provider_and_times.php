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
            // Add provider_id field if it doesn't exist
            if (!Schema::hasColumn('appointments', 'provider_id')) {
                $table->foreignId('provider_id')->nullable()->after('staff_id')->constrained('users')->onDelete('cascade');
            }
            
            // Add service_id field if it doesn't exist
            if (!Schema::hasColumn('appointments', 'service_id')) {
                $table->foreignId('service_id')->nullable()->after('location_id')->constrained('services')->onDelete('set null');
            }
            
            // Add package_id field if it doesn't exist
            if (!Schema::hasColumn('appointments', 'package_id')) {
                $table->foreignId('package_id')->nullable()->after('service_id')->constrained('packages')->onDelete('set null');
            }
            
            // Add start_time and end_time if they don't exist
            if (!Schema::hasColumn('appointments', 'start_time')) {
                $table->dateTime('start_time')->nullable()->after('appointment_time');
            }
            
            if (!Schema::hasColumn('appointments', 'end_time')) {
                $table->dateTime('end_time')->nullable()->after('start_time');
            }
            
            // Update status enum if needed
            // Note: Laravel doesn't easily support changing enum, so we'll handle it carefully
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'provider_id')) {
                $table->dropForeign(['provider_id']);
                $table->dropColumn('provider_id');
            }
            
            if (Schema::hasColumn('appointments', 'service_id')) {
                $table->dropForeign(['service_id']);
                $table->dropColumn('service_id');
            }
            
            if (Schema::hasColumn('appointments', 'package_id')) {
                $table->dropForeign(['package_id']);
                $table->dropColumn('package_id');
            }
            
            if (Schema::hasColumn('appointments', 'start_time')) {
                $table->dropColumn('start_time');
            }
            
            if (Schema::hasColumn('appointments', 'end_time')) {
                $table->dropColumn('end_time');
            }
        });
    }
};