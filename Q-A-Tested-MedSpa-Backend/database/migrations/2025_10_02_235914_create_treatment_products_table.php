<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('treatment_products', function (Blueprint $table) {
            $table->id();
            // Defer FKs to ensure referenced tables exist
            $table->unsignedBigInteger('treatment_id');
            $table->unsignedBigInteger('product_id');
            $table->index(['treatment_id']);
            $table->index(['product_id']);
            $table->integer('quantity');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('treatment_products');
    }
};
