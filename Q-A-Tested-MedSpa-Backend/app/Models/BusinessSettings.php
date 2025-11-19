<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessSettings extends Model
{
    protected $table = 'business_settings';
    
    protected $fillable = [
        'business_name',
        'business_type',
        'license_number',
        'tax_id',
        'website',
        'description',
        'address',
        'city',
        'state',
        'zip_code',
        'phone',
        'email',
        'hours',
        'currency',
        'timezone',
        'date_format',
        'time_format',
        'features',
        'locations',
    ];

    protected $casts = [
        'hours' => 'array',
        'features' => 'array',
        'locations' => 'array',
    ];
}
