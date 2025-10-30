<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('treatment_products', function (Blueprint $table) {
            if (Schema::hasTable('treatments') && Schema::hasColumn('treatment_products', 'treatment_id')) {
                $table->foreign('treatment_id')->references('id')->on('treatments')->onDelete('cascade');
            }
            if (Schema::hasTable('products') && Schema::hasColumn('treatment_products', 'product_id')) {
                $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            }
        });
    }

    public function down(): void
    {
        Schema::table('treatment_products', function (Blueprint $table) {
            if (Schema::hasColumn('treatment_products', 'treatment_id')) {
                $table->dropForeign(['treatment_id']);
            }
            if (Schema::hasColumn('treatment_products', 'product_id')) {
                $table->dropForeign(['product_id']);
            }
        });
    }
};


