<?php

namespace App\Services;

use Twilio\Rest\Client as TwilioClient;
use App\Models\SmsLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class TwilioService
{
    protected $twilio;
    protected $fromNumber;

    public function __construct()
    {
        $sid = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $this->fromNumber = config('services.twilio.from');

        if (!$sid || !$token || !$this->fromNumber) {
            Log::warning('Twilio credentials not configured');
            return;
        }

        $this->twilio = new TwilioClient($sid, $token);
    }

    /**
     * Send SMS message
     *
     * @param string $to Phone number in E.164 format
     * @param string $message Message body
     * @param array $options Additional options (type, user_id, appointment_id, payment_id, client_id)
     * @return SmsLog|null
     */
    public function sendSms(string $to, string $message, array $options = []): ?SmsLog
    {
        if (!$this->twilio) {
            Log::error('Twilio client not initialized');
            return null;
        }

        // Create SMS log entry
        $smsLog = SmsLog::create([
            'to_phone' => $to,
            'from_phone' => $this->fromNumber,
            'message' => $message,
            'status' => 'pending',
            'type' => $options['type'] ?? null,
            'user_id' => $options['user_id'] ?? null,
            'appointment_id' => $options['appointment_id'] ?? null,
            'payment_id' => $options['payment_id'] ?? null,
            'client_id' => $options['client_id'] ?? null,
        ]);

        try {
            // Send SMS via Twilio
            $twilioMessage = $this->twilio->messages->create($to, [
                'from' => $this->fromNumber,
                'body' => $message,
            ]);

            // Update SMS log with success
            $smsLog->update([
                'message_sid' => $twilioMessage->sid,
                'status' => 'sent',
                'twilio_response' => [
                    'sid' => $twilioMessage->sid,
                    'status' => $twilioMessage->status,
                    'price' => $twilioMessage->price,
                    'price_unit' => $twilioMessage->priceUnit,
                ],
            ]);

            Log::info("SMS sent successfully", [
                'to' => $to,
                'sid' => $twilioMessage->sid,
                'type' => $options['type'] ?? null,
            ]);

            return $smsLog;
        } catch (\Exception $e) {
            // Update SMS log with error
            $smsLog->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            Log::error("SMS send failed", [
                'to' => $to,
                'error' => $e->getMessage(),
                'type' => $options['type'] ?? null,
            ]);

            return $smsLog;
        }
    }

    /**
     * Send appointment reminder SMS
     */
    public function sendAppointmentReminder($appointment, $client): ?SmsLog
    {
        $message = "📅 Appointment Reminder\n"
            . "Date: " . ($appointment->start_time ? date('M d, Y g:i A', strtotime($appointment->start_time)) : 'N/A') . "\n"
            . "Location: " . optional($appointment->location)->name . "\n"
            . "Provider: " . optional($appointment->provider)->name . "\n"
            . "Please arrive 10 minutes early.";

        return $this->sendSms(
            $client->clientUser->phone ?? $client->phone,
            $message,
            [
                'type' => 'appointment_reminder',
                'appointment_id' => $appointment->id,
                'client_id' => $client->id,
            ]
        );
    }

    /**
     * Send appointment confirmation SMS
     */
    public function sendAppointmentConfirmation($appointment, $client): ?SmsLog
    {
        $message = "✅ Appointment Confirmed\n"
            . "Date: " . ($appointment->start_time ? date('M d, Y g:i A', strtotime($appointment->start_time)) : 'N/A') . "\n"
            . "Location: " . optional($appointment->location)->name . "\n"
            . "Provider: " . optional($appointment->provider)->name . "\n"
            . "We look forward to seeing you!";

        return $this->sendSms(
            $client->clientUser->phone ?? $client->phone,
            $message,
            [
                'type' => 'appointment_confirmation',
                'appointment_id' => $appointment->id,
                'client_id' => $client->id,
            ]
        );
    }

    /**
     * Send appointment rescheduled SMS
     */
    public function sendAppointmentRescheduled($appointment, $client, $oldTime = null): ?SmsLog
    {
        $message = "🔄 Appointment Rescheduled\n"
            . "New Date: " . ($appointment->start_time ? date('M d, Y g:i A', strtotime($appointment->start_time)) : 'N/A') . "\n"
            . ($oldTime ? "Previous Date: " . date('M d, Y g:i A', strtotime($oldTime)) . "\n" : "")
            . "Location: " . optional($appointment->location)->name . "\n"
            . "Please confirm if this time works for you.";

        return $this->sendSms(
            $client->clientUser->phone ?? $client->phone,
            $message,
            [
                'type' => 'appointment_rescheduled',
                'appointment_id' => $appointment->id,
                'client_id' => $client->id,
            ]
        );
    }

    /**
     * Send appointment cancellation SMS
     */
    public function sendAppointmentCancelled($appointment, $client): ?SmsLog
    {
        $message = "❌ Appointment Cancelled\n"
            . "Date: " . ($appointment->start_time ? date('M d, Y g:i A', strtotime($appointment->start_time)) : 'N/A') . "\n"
            . "We're sorry to see you go. Please reschedule when convenient.";

        return $this->sendSms(
            $client->clientUser->phone ?? $client->phone,
            $message,
            [
                'type' => 'appointment_cancelled',
                'appointment_id' => $appointment->id,
                'client_id' => $client->id,
            ]
        );
    }

    /**
     * Send welcome SMS to new client
     */
    public function sendWelcomeSms($client): ?SmsLog
    {
        $message = "👋 Welcome to " . config('app.name') . "!\n"
            . "We're excited to have you as a client.\n"
            . "Book your first appointment today!";

        return $this->sendSms(
            $client->clientUser->phone ?? $client->phone,
            $message,
            [
                'type' => 'welcome',
                'client_id' => $client->id,
            ]
        );
    }

    /**
     * Send follow-up SMS (Provider)
     */
    public function sendFollowUpSms($appointment, $client): ?SmsLog
    {
        $message = "💬 Follow-up from " . optional($appointment->provider)->name . "\n"
            . "How was your appointment? We'd love to hear your feedback.\n"
            . "Reply to this message or call us.";

        return $this->sendSms(
            $client->clientUser->phone ?? $client->phone,
            $message,
            [
                'type' => 'follow_up',
                'appointment_id' => $appointment->id,
                'client_id' => $client->id,
                'user_id' => $appointment->provider_id,
            ]
        );
    }

    /**
     * Send review request SMS (Provider)
     */
    public function sendReviewRequest($appointment, $client): ?SmsLog
    {
        $message = "⭐ We'd Love Your Feedback!\n"
            . "How was your experience with " . optional($appointment->provider)->name . "?\n"
            . "Please leave us a review!";

        return $this->sendSms(
            $client->clientUser->phone ?? $client->phone,
            $message,
            [
                'type' => 'review_request',
                'appointment_id' => $appointment->id,
                'client_id' => $client->id,
                'user_id' => $appointment->provider_id,
            ]
        );
    }

    /**
     * Send post-care instructions SMS (Provider)
     */
    public function sendPostCareInstructions($appointment, $client, $instructions = null): ?SmsLog
    {
        $defaultInstructions = "📋 Post-Care Instructions\n"
            . "• Avoid direct sunlight for 24 hours\n"
            . "• Keep the area clean and dry\n"
            . "• Contact us if you have any concerns";

        $message = $instructions ?? $defaultInstructions;

        return $this->sendSms(
            $client->clientUser->phone ?? $client->phone,
            $message,
            [
                'type' => 'post_care_instructions',
                'appointment_id' => $appointment->id,
                'client_id' => $client->id,
                'user_id' => $appointment->provider_id,
            ]
        );
    }

    /**
     * Send marketing SMS (Admin)
     */
    public function sendMarketingSms($to, $message, $clientId = null): ?SmsLog
    {
        return $this->sendSms(
            $to,
            $message,
            [
                'type' => 'marketing',
                'client_id' => $clientId,
            ]
        );
    }

    /**
     * Send system alert SMS (Admin)
     */
    public function sendSystemAlert($to, $message, $userId = null): ?SmsLog
    {
        return $this->sendSms(
            $to,
            $message,
            [
                'type' => 'system_alert',
                'user_id' => $userId,
            ]
        );
    }
}

