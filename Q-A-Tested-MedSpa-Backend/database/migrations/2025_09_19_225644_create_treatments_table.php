<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treatments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('appointments')->onDelete('cascade');
            $table->foreignId('provider_id')->constrained('users')->onDelete('cascade');

            // Required for Week 5 workflow
            $table->string('treatment_type');
            $table->decimal('cost', 8, 2);
            $table->string('status');
            $table->text('description')->nullable();
            $table->dateTime('treatment_date');

            // Optional / existing
            $table->text('notes')->nullable();
            $table->string('before_photo')->nullable();
            $table->string('after_photo')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('treatments');
    }
};
