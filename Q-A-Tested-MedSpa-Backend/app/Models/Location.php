<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'city',
        'state',
        'zip_code',
        'timezone',
        'contact_phone',
        'contact_email',
        'zip',
    ];

    // Many-to-many: ek location me multiple staff
    public function staff()
    {
        return $this->belongsToMany(Staff::class, 'location_staff');
    }

    // Ek location ke multiple clients
    public function clients()
    {
        return $this->hasMany(Client::class);
    }
}
