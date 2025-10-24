<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'location_id',
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
}
