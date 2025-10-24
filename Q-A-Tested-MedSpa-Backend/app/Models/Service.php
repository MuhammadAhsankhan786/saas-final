<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'category',
        'name',
        'description',
        'price',
        'duration',
        'package_id',
        'active',
    ];

    // 🔹 Service belongs to a Package
    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    // 🔹 Consent Forms relation
    public function consentForms()
    {
        return $this->hasMany(ConsentForm::class);
    }
}
