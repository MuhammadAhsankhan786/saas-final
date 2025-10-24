<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Add required fields for appointments
            $table->dateTime('start_time')->nullable()->after('appointment_time');
            $table->dateTime('end_time')->nullable()->after('start_time');
            $table->foreignId('service_id')->nullable()->constrained('services')->onDelete('set null')->after('end_time');
            $table->foreignId('provider_id')->nullable()->constrained('users')->onDelete('set null')->after('service_id');
            $table->foreignId('package_id')->nullable()->constrained('packages')->onDelete('set null')->after('provider_id');
            
            // Update status enum to match requirements
            $table->dropColumn('status');
        });
        
        Schema::table('appointments', function (Blueprint $table) {
            $table->enum('status', ['booked', 'completed', 'canceled'])->default('booked')->after('package_id');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropForeign(['provider_id']);
            $table->dropForeign(['package_id']);
            $table->dropColumn(['start_time', 'end_time', 'service_id', 'provider_id', 'package_id']);
        });
    }
};