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
        Schema::create('compliance_alerts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('type'); // 'consent', 'compliance', 'training', 'equipment', 'backup'
            $table->string('priority'); // 'critical', 'high', 'medium', 'low'
            $table->string('status')->default('active'); // 'active', 'resolved', 'dismissed'
            $table->integer('affected_items')->default(0);
            $table->date('due_date');
            $table->string('assigned_to');
            $table->string('category'); // 'Documentation', 'Security', 'Training', 'Equipment', 'Data Security'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compliance_alerts');
    }
};

