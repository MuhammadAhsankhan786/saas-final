<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'amount',
        'invoice_date',
        'status',
    ];

    // 🔹 Relation: har invoice ek patient se belong karta hai
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    // 🔹 Default invoice_date agar null ho
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($invoice) {
            if (empty($invoice->invoice_date)) {
                $invoice->invoice_date = now()->toDateString();
            }
        });
    }
}
