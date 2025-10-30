<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            // Define foreign key columns without constraints here to avoid
            // dependency order issues; constraints added in a later migration
            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('staff_id');
            $table->unsignedBigInteger('location_id');
            $table->index(['client_id']);
            $table->index(['staff_id']);
            $table->index(['location_id']);
            $table->dateTime('appointment_time'); // full datetime (date + time)
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled', 'scheduled'])->default('scheduled'); 
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
