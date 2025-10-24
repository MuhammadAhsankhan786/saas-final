<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('client_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('package_id')->constrained('packages')->onDelete('cascade');
            $table->timestamp('assigned_at')->nullable();
            $table->timestamps();

            // Ye line foreignId ke baad rakho
            $table->unique(['client_id', 'package_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('client_packages');
    }
};
