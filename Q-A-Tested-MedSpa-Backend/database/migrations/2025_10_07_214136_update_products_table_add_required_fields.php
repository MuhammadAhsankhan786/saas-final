<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Add required fields for inventory management
            $table->string('category')->nullable()->after('name');
            $table->date('expiry_date')->nullable()->after('current_stock');
            $table->string('lot_number')->nullable()->after('expiry_date');
            $table->integer('low_stock_threshold')->default(5)->after('minimum_stock');
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('cascade')->after('lot_number');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['location_id']);
            $table->dropColumn(['category', 'expiry_date', 'lot_number', 'low_stock_threshold', 'location_id']);
        });
    }
};