<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Treatment extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'provider_id',
        'treatment_type',
        'cost',
        'status',
        'description',
        'treatment_date',
        'notes',        
        'before_photo', 
        'after_photo',  
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }

    public function provider()
    {
        return $this->belongsTo(User::class, 'provider_id');
    }

    // Optional: products relation only if needed
    // public function products()
    // {
    //     return $this->belongsToMany(Product::class)->withPivot('quantity');
    // }
}
