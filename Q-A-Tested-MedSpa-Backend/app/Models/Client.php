<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    // Add name and email to fillable
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'phone',
        'location_id',
        'date_of_birth',
        'gender',
        'address',
        'city',
        'state',
        'zip_code',
        'emergency_contact_name',
        'emergency_contact_phone',
        'medical_history',
        'allergies',
        'medications',
        'skin_type',
        'concerns',
        'preferred_provider_id',
        'preferred_location_id',
        'marketing_consent',
        'sms_consent',
        'email_consent',
        'notes',
    ];

    // Client belongs to ek User
    public function clientUser()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Client belongs to ek Location
    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    // Client has many Appointments
    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    // Client has many ConsentForms
    public function consentForms()
    {
        return $this->hasMany(ConsentForm::class);
    }

    // Client has many Packages through ClientPackage
    public function packages()
    {
        return $this->belongsToMany(Package::class, 'client_packages');
    }

    protected function casts(): array
    {
        return [
            'medical_history' => \App\Casts\EncryptedJson::class,
        ];
    }
}
