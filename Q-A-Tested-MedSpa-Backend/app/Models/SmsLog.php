<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsLog extends Model
{
    protected $fillable = [
        'to_phone',
        'from_phone',
        'message',
        'message_sid',
        'status',
        'type',
        'user_id',
        'appointment_id',
        'payment_id',
        'client_id',
        'error_message',
        'twilio_response',
    ];

    protected $casts = [
        'twilio_response' => 'array',
    ];

    /**
     * Get the user who triggered the SMS
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the appointment related to this SMS
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the payment related to this SMS
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /**
     * Get the client related to this SMS
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
