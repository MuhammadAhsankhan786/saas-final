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
        Schema::create('business_settings', function (Blueprint $table) {
            $table->id();
            $table->string('business_name');
            $table->string('business_type');
            $table->string('license_number')->nullable();
            $table->string('tax_id')->nullable();
            $table->string('website')->nullable();
            $table->text('description')->nullable();
            $table->string('address');
            $table->string('city');
            $table->string('state');
            $table->string('zip_code');
            $table->string('phone');
            $table->string('email');
            $table->json('hours'); // Store business hours as JSON
            $table->string('currency')->default('USD');
            $table->string('timezone')->default('America/New_York');
            $table->string('date_format')->default('MM/DD/YYYY');
            $table->string('time_format')->default('12');
            $table->json('features'); // Store enabled features as JSON
            $table->json('locations'); // Store business locations as JSON
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_settings');
    }
};
