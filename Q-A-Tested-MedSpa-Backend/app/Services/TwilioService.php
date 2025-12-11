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
     * Get client phone number with priority
     *
     * @param object $client Client object
     * @return string|null Phone number or null if not found
     */
    private function getClientPhone($client): ?string
    {
        if ($client->clientUser && !empty($client->clientUser->phone)) {
            return $client->clientUser->phone;
        }
        
        if (!empty($client->phone)) {
            return $client->phone;
        }
        
        return null;
    }

    /**
     * Format phone number to E.164 format
     *
     * @param string $phone Phone number
     * @return string|null Formatted phone number or null if invalid
     */
    private function formatPhoneNumber(string $phone): ?string
    {
        if (empty($phone) || trim($phone) === '') {
            return null;
        }

        // Remove all non-digit characters except +
        $phone = preg_replace('/[^0-9+]/', '', trim($phone));

        // If empty after cleaning, return null
        if (empty($phone)) {
            return null;
        }

        // If already starts with +, validate length
        if (strpos($phone, '+') === 0) {
            // Remove + for length check
            $digits = substr($phone, 1);
            // E.164 format: + followed by 1-15 digits
            if (strlen($digits) >= 10 && strlen($digits) <= 15) {
                return $phone;
            }
        }

        // If starts with 00, replace with +
        if (strpos($phone, '00') === 0) {
            $phone = '+' . substr($phone, 2);
            $digits = substr($phone, 1);
            if (strlen($digits) >= 10 && strlen($digits) <= 15) {
                return $phone;
            }
        }

        // If it's a 10-digit number (US/Canada), add +1
        if (strlen($phone) == 10 && ctype_digit($phone)) {
            return '+1' . $phone;
        }

        // If it's an 11-digit number starting with 1, add +
        if (strlen($phone) == 11 && substr($phone, 0, 1) == '1' && ctype_digit($phone)) {
            return '+' . $phone;
        }

        // For other formats (12-15 digits), try to add + if missing
        if (strlen($phone) >= 10 && strlen($phone) <= 15 && ctype_digit($phone)) {
            return '+' . $phone;
        }

        // If too short or invalid, return null
        Log::warning('Invalid phone number format', [
            'phone' => $phone,
            'length' => strlen($phone),
            'is_digit' => ctype_digit($phone)
        ]);
        return null;
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

        // Format phone number to E.164 format
        $formattedPhone = $this->formatPhoneNumber($to);
        
        if (!$formattedPhone) {
            Log::error('Invalid phone number format', [
                'original' => $to,
                'type' => $options['type'] ?? null,
                'appointment_id' => $options['appointment_id'] ?? null,
            ]);
            
            // Create failed SMS log
            return SmsLog::create([
                'to_phone' => $to,
                'from_phone' => $this->fromNumber,
                'message' => $message,
                'status' => 'failed',
                'error_message' => 'Invalid phone number format. Phone must be in E.164 format (e.g., +1234567890)',
                'type' => $options['type'] ?? null,
                'user_id' => $options['user_id'] ?? null,
                'appointment_id' => $options['appointment_id'] ?? null,
                'payment_id' => $options['payment_id'] ?? null,
                'client_id' => $options['client_id'] ?? null,
            ]);
        }

        // Create SMS log entry
        $smsLog = SmsLog::create([
            'to_phone' => $formattedPhone,
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
            $twilioMessage = $this->twilio->messages->create($formattedPhone, [
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
        $phone = $this->getClientPhone($client);
        if (empty($phone)) {
            Log::warning('No phone number found for appointment reminder', [
                'client_id' => $client->id,
                'appointment_id' => $appointment->id ?? null,
            ]);
            return null;
        }

        $message = "📅 Appointment Reminder\n"
            . "Date: " . ($appointment->start_time ? date('M d, Y g:i A', strtotime($appointment->start_time)) : 'N/A') . "\n"
            . "Location: " . optional($appointment->location)->name . "\n"
            . "Provider: " . optional($appointment->provider)->name . "\n"
            . "Please arrive 10 minutes early.";

        return $this->sendSms(
            $phone,
            $message,
            [
                'type' => 'appointment_reminder',
                'appointment_id' => $appointment->id ?? null,
                'client_id' => $client->id,
            ]
        );
    }

    /**
     * Send appointment confirmation SMS
     */
    public function sendAppointmentConfirmation($appointment, $client): ?SmsLog
    {
        // Get phone number with priority: clientUser->phone > client->phone
        $phone = null;
        if ($client->clientUser && !empty($client->clientUser->phone)) {
            $phone = $client->clientUser->phone;
        } elseif (!empty($client->phone)) {
            $phone = $client->phone;
        }

        // If no phone number found, log and return null
        if (empty($phone)) {
            Log::warning('No phone number found for client', [
                'client_id' => $client->id,
                'appointment_id' => $appointment->id ?? null,
            ]);
            
            // Create failed SMS log
            return SmsLog::create([
                'to_phone' => null,
                'from_phone' => $this->fromNumber,
                'message' => 'Appointment confirmation message',
                'status' => 'failed',
                'error_message' => 'No phone number found for client. Please update client phone number.',
                'type' => 'appointment_confirmation',
                'appointment_id' => $appointment->id ?? null,
                'client_id' => $client->id,
            ]);
        }

        $message = "✅ Appointment Confirmed\n"
            . "Date: " . ($appointment->start_time ? date('M d, Y g:i A', strtotime($appointment->start_time)) : 'N/A') . "\n"
            . "Location: " . optional($appointment->location)->name . "\n"
            . "Provider: " . optional($appointment->provider)->name . "\n"
            . "We look forward to seeing you!";

        return $this->sendSms(
            $phone,
            $message,
            [
                'type' => 'appointment_confirmation',
                'appointment_id' => $appointment->id ?? null,
                'client_id' => $client->id,
            ]
        );
    }

    /**
     * Send appointment rescheduled SMS
     */
    public function sendAppointmentRescheduled($appointment, $client, $oldTime = null): ?SmsLog
    {
        $phone = $this->getClientPhone($client);
        if (empty($phone)) {
            Log::warning('No phone number found for appointment rescheduled', [
                'client_id' => $client->id,
                'appointment_id' => $appointment->id ?? null,
            ]);
            return null;
        }

        $message = "🔄 Appointment Rescheduled\n"
            . "New Date: " . ($appointment->start_time ? date('M d, Y g:i A', strtotime($appointment->start_time)) : 'N/A') . "\n"
            . ($oldTime ? "Previous Date: " . date('M d, Y g:i A', strtotime($oldTime)) . "\n" : "")
            . "Location: " . optional($appointment->location)->name . "\n"
            . "Please confirm if this time works for you.";

        return $this->sendSms(
            $phone,
            $message,
            [
                'type' => 'appointment_rescheduled',
                'appointment_id' => $appointment->id ?? null,
                'client_id' => $client->id,
            ]
        );
    }

    /**
     * Send appointment cancellation SMS
     */
    public function sendAppointmentCancelled($appointment, $client): ?SmsLog
    {
        $phone = $this->getClientPhone($client);
        if (empty($phone)) {
            Log::warning('No phone number found for appointment cancellation', [
                'client_id' => $client->id,
                'appointment_id' => $appointment->id ?? null,
            ]);
            return null;
        }

        $message = "❌ Appointment Cancelled\n"
            . "Date: " . ($appointment->start_time ? date('M d, Y g:i A', strtotime($appointment->start_time)) : 'N/A') . "\n"
            . "We're sorry to see you go. Please reschedule when convenient.";

        return $this->sendSms(
            $phone,
            $message,
            [
                'type' => 'appointment_cancelled',
                'appointment_id' => $appointment->id ?? null,
                'client_id' => $client->id,
            ]
        );
    }

    /**
     * Send welcome SMS to new client
     */
    public function sendWelcomeSms($client): ?SmsLog
    {
        $phone = $this->getClientPhone($client);
        if (empty($phone)) {
            Log::warning('No phone number found for welcome SMS', [
                'client_id' => $client->id,
            ]);
            return null;
        }

        $message = "👋 Welcome to " . config('app.name') . "!\n"
            . "We're excited to have you as a client.\n"
            . "Book your first appointment today!";

        return $this->sendSms(
            $phone,
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
        $phone = $this->getClientPhone($client);
        if (empty($phone)) {
            Log::warning('No phone number found for follow-up SMS', [
                'client_id' => $client->id,
                'appointment_id' => $appointment->id ?? null,
            ]);
            return null;
        }

        $message = "💬 Follow-up from " . optional($appointment->provider)->name . "\n"
            . "How was your appointment? We'd love to hear your feedback.\n"
            . "Reply to this message or call us.";

        return $this->sendSms(
            $phone,
            $message,
            [
                'type' => 'follow_up',
                'appointment_id' => $appointment->id ?? null,
                'client_id' => $client->id,
                'user_id' => $appointment->provider_id ?? null,
            ]
        );
    }

    /**
     * Send review request SMS (Provider)
     */
    public function sendReviewRequest($appointment, $client): ?SmsLog
    {
        $phone = $this->getClientPhone($client);
        if (empty($phone)) {
            Log::warning('No phone number found for review request SMS', [
                'client_id' => $client->id,
                'appointment_id' => $appointment->id ?? null,
            ]);
            return null;
        }

        $message = "⭐ We'd Love Your Feedback!\n"
            . "How was your experience with " . optional($appointment->provider)->name . "?\n"
            . "Please leave us a review!";

        return $this->sendSms(
            $phone,
            $message,
            [
                'type' => 'review_request',
                'appointment_id' => $appointment->id ?? null,
                'client_id' => $client->id,
                'user_id' => $appointment->provider_id ?? null,
            ]
        );
    }

    /**
     * Send post-care instructions SMS (Provider)
     */
    public function sendPostCareInstructions($appointment, $client, $instructions = null): ?SmsLog
    {
        $phone = $this->getClientPhone($client);
        if (empty($phone)) {
            Log::warning('No phone number found for post-care instructions SMS', [
                'client_id' => $client->id,
                'appointment_id' => $appointment->id ?? null,
            ]);
            return null;
        }

        $defaultInstructions = "📋 Post-Care Instructions\n"
            . "• Avoid direct sunlight for 24 hours\n"
            . "• Keep the area clean and dry\n"
            . "• Contact us if you have any concerns";

        $message = $instructions ?? $defaultInstructions;

        return $this->sendSms(
            $phone,
            $message,
            [
                'type' => 'post_care_instructions',
                'appointment_id' => $appointment->id ?? null,
                'client_id' => $client->id,
                'user_id' => $appointment->provider_id ?? null,
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

