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
        Schema::table('users', function (Blueprint $table) {
            // Profile fields
            $table->string('first_name')->nullable()->after('name');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('title')->nullable()->after('last_name');
            $table->string('department')->nullable()->after('title');
            $table->text('bio')->nullable()->after('department');
            $table->string('address')->nullable()->after('bio');
            $table->string('city')->nullable()->after('address');
            $table->string('state')->nullable()->after('city');
            $table->string('zip_code')->nullable()->after('state');
            $table->date('date_of_birth')->nullable()->after('zip_code');
            $table->string('emergency_contact')->nullable()->after('date_of_birth');
            $table->string('emergency_phone')->nullable()->after('emergency_contact');
            $table->string('profile_image')->nullable()->after('emergency_phone');
            
            // Notification preferences (JSON)
            $table->json('notification_preferences')->nullable()->after('profile_image');
            
            // Privacy settings (JSON)
            $table->json('privacy_settings')->nullable()->after('notification_preferences');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'first_name',
                'last_name', 
                'title',
                'department',
                'bio',
                'address',
                'city',
                'state',
                'zip_code',
                'date_of_birth',
                'emergency_contact',
                'emergency_phone',
                'profile_image',
                'notification_preferences',
                'privacy_settings'
            ]);
        });
    }
};
