<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id', 'appointment_id', 'package_id', 'amount',
        'payment_method', 'stripe_payment_intent_id', 'tips', 'commission', 'status'
    ];

    // Relations
    public function client() {
        return $this->belongsTo(Client::class);
    }

    public function appointment() {
        return $this->belongsTo(Appointment::class);
    }

    public function package() {
        return $this->belongsTo(Package::class);
    }
}
