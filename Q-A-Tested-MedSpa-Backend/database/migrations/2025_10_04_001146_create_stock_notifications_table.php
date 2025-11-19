<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->integer('current_stock');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
            
            // Note: Foreign key constraint removed due to migration compatibility
            // Can be added later via separate migration if needed
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_notifications');
    }
};
