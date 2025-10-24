<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = ['name']; // role ka naam

    // Role ke users (many-to-many)
    public function users()
    {
        return $this->belongsToMany(\App\Models\User::class, 'role_user');
    }
}
