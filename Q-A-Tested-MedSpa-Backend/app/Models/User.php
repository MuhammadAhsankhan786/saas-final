<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject, CanResetPasswordContract
{
    use HasFactory, Notifiable, CanResetPassword;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'location_id',
        'phone',
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
        'privacy_settings',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'date_of_birth' => 'date',
            'notification_preferences' => 'array',
            'privacy_settings' => 'array',
        ];
    }

    // 🔹 Required by JWT
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    // User belongs to one location
    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    // User can be staff (1-to-1)
    public function staff()
    {
        return $this->hasOne(Staff::class);
    }

    // User can be client (1-to-1)
    public function client()
    {
        return $this->hasOne(Client::class);
    }

    // User has many appointments as provider
    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'provider_id');
    }

    // 🔹 User ke multiple roles
    public function roles()
    {
        return $this->belongsToMany(\App\Models\Role::class, 'role_user');
    }

    /**
     * Send the password reset notification.
     * Override to use custom frontend URL
     */
    public function sendPasswordResetNotification($token)
    {
        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'));
        $resetUrl = "{$frontendUrl}/reset-password?token={$token}&email=" . urlencode($this->email);

        $this->notify(new \App\Notifications\ResetPasswordNotification($token));
    }
}
