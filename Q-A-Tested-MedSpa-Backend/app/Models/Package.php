<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'services_included',
        'price',
        'duration',
    ];

    protected $casts = [
        'services_included' => 'array',
    ];

    // 🔹 Package has many Services
    public function services()
    {
        return $this->hasMany(Service::class);
    }
}
