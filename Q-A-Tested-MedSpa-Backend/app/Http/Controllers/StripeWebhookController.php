<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Payment;
use App\Notifications\AppointmentCreated;
use Twilio\Rest\Client as TwilioClient;

class StripeWebhookController extends Controller
{
    public function handleWebhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $endpointSecret = env('STRIPE_WEBHOOK_SECRET');

        try {
            // Verify webhook signature
            $event = \Stripe\Webhook::constructEvent(
                $payload,
                $sigHeader,
                $endpointSecret
            );
        } catch (\UnexpectedValueException $e) {
            Log::error('Invalid payload: ' . $e->getMessage());
            return response('Invalid payload', 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            Log::error('Invalid signature: ' . $e->getMessage());
            return response('Invalid signature', 400);
        }

        // Handle the event
        switch ($event->type) {
            case 'payment_intent.succeeded':
                $paymentIntent = $event->data->object;
                Log::info('✅ Payment succeeded: ' . $paymentIntent->id);
                
                // Update payment status in database
                $this->updatePaymentStatus($paymentIntent->id, 'completed');
                
                // Send SMS notification for successful payment
                $this->sendPaymentSms($paymentIntent->id);
                break;

            case 'payment_intent.payment_failed':
                $paymentIntent = $event->data->object;
                Log::warning('❌ Payment failed: ' . $paymentIntent->id);
                
                // Update payment status in database
                $this->updatePaymentStatus($paymentIntent->id, 'failed');
                break;

            default:
                Log::info('ℹ️ Unhandled event type: ' . $event->type);
        }

        return response('Webhook received', 200);
    }

    private function updatePaymentStatus($stripePaymentIntentId, $status)
    {
        try {
            // Find payment by Stripe payment intent ID and update status
            $payment = Payment::where('stripe_payment_intent_id', $stripePaymentIntentId)->first();
            
            if ($payment) {
                $payment->status = $status;
                $payment->save();
                
                Log::info("✅ Payment status updated to: {$status} for Stripe ID: {$stripePaymentIntentId}");
            } else {
                Log::warning("⚠️ Payment not found for Stripe ID: {$stripePaymentIntentId}");
            }
        } catch (\Exception $e) {
            Log::error("❌ Error updating payment status: " . $e->getMessage());
        }
    }

    private function sendPaymentSms($stripePaymentIntentId)
    {
        try {
            $payment = Payment::with(['client.clientUser', 'appointment', 'appointment.provider'])
                ->where('stripe_payment_intent_id', $stripePaymentIntentId)
                ->first();

            if (!$payment) {
                Log::warning("⚠️ Payment not found for SMS: {$stripePaymentIntentId}");
                return;
            }

            // Send SMS to client about payment confirmation
            if ($payment->client && $payment->client->clientUser && $payment->client->clientUser->phone) {
                $twilio = new TwilioClient(
                    config('services.twilio.sid'),
                    config('services.twilio.token')
                );

                $clientName = $payment->client->clientUser->name ?? 'Client';
                $message = "✅ Payment Confirmed\n"
                    . "Amount: $" . number_format($payment->amount, 2) . "\n"
                    . "Transaction ID: " . substr($payment->stripe_payment_intent_id, 0, 8) . "...\n"
                    . "Thank you for your payment!";

                $twilio->messages->create($payment->client->clientUser->phone, [
                    'from' => config('services.twilio.from'),
                    'body' => $message,
                ]);

                Log::info("📱 Payment confirmation SMS sent to: {$clientName}");
            }

            // If payment was linked to an appointment with a provider, send notification
            if ($payment->appointment && $payment->appointment->provider_id) {
                $appointment = $payment->appointment;
                $appointment->load(['client.clientUser', 'provider', 'location', 'service', 'package']);
                
                try {
                    $appointment->provider->notify(new AppointmentCreated($appointment));
                    Log::info("📨 Appointment SMS sent to provider: {$appointment->provider->name}");
                } catch (\Exception $e) {
                    Log::error("Failed to send appointment notification: " . $e->getMessage());
                }
            }

        } catch (\Exception $e) {
            Log::error("❌ Error sending payment SMS: " . $e->getMessage());
        }
    }
}
