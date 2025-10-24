<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Twilio\Rest\Client;

class AppointmentCreated extends Notification implements ShouldQueue
{
    use Queueable;

    protected $appointment;

    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
    }

    public function via($notifiable): array
    {
        //maill add krni he ✅ Ab mail + database + sms sab chalenge
        return [ 'database', 'sms'];
    }

    public function toMail($notifiable): MailMessage
    {
        $appointment = $this->appointment;

        return (new MailMessage)
            ->subject('📅 New Appointment Assigned')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('A new appointment has been booked.')
            ->line('🔹 Client: ' . $appointment->client->name)
            ->line('🔹 Location: ' . optional($appointment->location)->name)
            ->line('🔹 Date & Time: ' . $appointment->appointment_time)
            ->line('Notes: ' . ($appointment->notes ?? 'No additional notes'))
            ->action('View Appointment', url('/appointments/' . $appointment->id))
            ->line('Thank you!');
    }

    public function toArray($notifiable): array
    {
        $appointment = $this->appointment;

        return [
            'appointment_id' => $appointment->id,
            'client' => $appointment->client->name,
            'staff' => $appointment->staff->name ?? null,
            'location' => optional($appointment->location)->name,
            'time' => $appointment->appointment_time,
            'notes' => $appointment->notes,
        ];
    }

    public function toSms($notifiable)
    {
        $appointment = $this->appointment;

        $message = "📅 New Appointment Assigned\n"
            . "Client: " . $appointment->client->name . "\n"
            . "Time: " . $appointment->appointment_time . "\n"
            . "Location: " . optional($appointment->location)->name;

        $twilio = new Client(
            config('services.twilio.sid'),
            config('services.twilio.token')
        );

        try {
            return $twilio->messages->create($notifiable->phone, [
                'from' => config('services.twilio.from'),
                'body' => $message,
            ]);
        } catch (\Exception $e) {
            \Log::error('Twilio SMS failed: ' . $e->getMessage());
            return null;
        }
    }
}
