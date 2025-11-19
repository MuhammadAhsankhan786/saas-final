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
        Schema::create('stock_alerts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->string('product_name');
            $table->string('sku');
            $table->string('category')->nullable();
            $table->string('supplier')->nullable();
            $table->integer('current_stock');
            $table->integer('min_stock')->default(0);
            $table->integer('max_stock')->default(0);
            $table->string('unit')->nullable();
            $table->string('alert_type'); // 'critical', 'high-priority', 'out-of-stock', 'low-stock', 'expiring-soon'
            $table->string('priority'); // 'critical', 'high', 'medium', 'low'
            $table->integer('days_until_out')->default(0);
            $table->date('last_restocked')->nullable();
            $table->date('expiry_date')->nullable();
            $table->decimal('cost', 10, 2)->default(0);
            $table->decimal('selling_price', 10, 2)->default(0);
            $table->string('status')->default('active'); // 'active', 'dismissed', 'resolved'
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Note: Foreign key constraint removed due to migration issues
            // Can be added later via separate migration if needed
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_alerts');
    }
};