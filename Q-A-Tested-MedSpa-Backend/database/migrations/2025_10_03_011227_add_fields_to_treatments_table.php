<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('treatments', function (Blueprint $table) {
   
          
       
            $table->text('description')->nullable()->after('status');
            $table->dateTime('treatment_date')->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('treatments', function (Blueprint $table) {
            $table->dropColumn(['treatment_type', 'cost', 'status', 'description', 'treatment_date']);
        });
    }
};
