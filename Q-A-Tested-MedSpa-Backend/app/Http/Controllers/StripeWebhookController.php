<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
        // Find payment by Stripe payment intent ID and update status
        // This would require adding a stripe_payment_intent_id field to payments table
        // For now, just log the action
        Log::info("Updating payment status to: {$status} for Stripe ID: {$stripePaymentIntentId}");
    }
}
