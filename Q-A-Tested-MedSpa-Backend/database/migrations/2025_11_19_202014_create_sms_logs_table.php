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
        Schema::create('sms_logs', function (Blueprint $table) {
            $table->id();
            $table->string('to_phone', 20); // Recipient phone number
            $table->string('from_phone', 20)->nullable(); // Twilio from number
            $table->text('message'); // SMS message body
            $table->string('message_sid')->nullable(); // Twilio message SID
            $table->enum('status', ['pending', 'sent', 'delivered', 'failed'])->default('pending');
            $table->string('type')->nullable(); // appointment_reminder, payment_confirmation, etc.
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->onDelete('set null');
            $table->foreignId('payment_id')->nullable()->constrained('payments')->onDelete('set null');
            $table->foreignId('client_id')->nullable()->constrained('clients')->onDelete('set null');
            $table->text('error_message')->nullable();
            $table->json('twilio_response')->nullable(); // Full Twilio API response
            $table->timestamps();
            
            // Indexes for faster queries
            $table->index('to_phone');
            $table->index('status');
            $table->index('type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_logs');
    }
};
