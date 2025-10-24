<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('name');               
            $table->string('email')->unique();    
            $table->string('phone')->nullable();  
            $table->date('dob')->nullable();      
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->text('address')->nullable();  
            $table->text('notes')->nullable();    
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
