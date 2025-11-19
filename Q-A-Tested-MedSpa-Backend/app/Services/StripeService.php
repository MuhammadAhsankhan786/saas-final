<?php

namespace App\Services;

use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Customer;
use Stripe\Subscription;
use Stripe\Invoice;
use Stripe\Refund;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class StripeService
{
    protected $secretKey;

    public function __construct()
    {
        $this->secretKey = config('services.stripe.secret');
        if ($this->secretKey) {
            Stripe::setApiKey($this->secretKey);
        }
    }

    /**
     * Create a payment intent
     *
     * @param float $amount Amount in dollars
     * @param string $currency Currency code (default: usd)
     * @param array $metadata Additional metadata
     * @return PaymentIntent|null
     */
    public function createPaymentIntent(float $amount, string $currency = 'usd', array $metadata = []): ?PaymentIntent
    {
        if (!$this->secretKey) {
            Log::error('Stripe secret key not configured');
            return null;
        }

        try {
            $paymentIntent = PaymentIntent::create([
                'amount' => (int)($amount * 100), // Convert to cents
                'currency' => $currency,
                'metadata' => $metadata,
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
            ]);

            Log::info('Stripe PaymentIntent created', [
                'id' => $paymentIntent->id,
                'amount' => $amount,
            ]);

            return $paymentIntent;
        } catch (\Exception $e) {
            Log::error('Stripe PaymentIntent creation failed', [
                'error' => $e->getMessage(),
                'amount' => $amount,
            ]);
            return null;
        }
    }

    /**
     * Retrieve a payment intent
     */
    public function retrievePaymentIntent(string $paymentIntentId): ?PaymentIntent
    {
        if (!$this->secretKey) {
            return null;
        }

        try {
            return PaymentIntent::retrieve($paymentIntentId);
        } catch (\Exception $e) {
            Log::error('Stripe PaymentIntent retrieval failed', [
                'error' => $e->getMessage(),
                'payment_intent_id' => $paymentIntentId,
            ]);
            return null;
        }
    }

    /**
     * Create or retrieve Stripe customer
     */
    public function getOrCreateCustomer($user, $email, $name = null): ?Customer
    {
        if (!$this->secretKey) {
            return null;
        }

        try {
            // Check if customer already exists
            $customers = Customer::all(['email' => $email, 'limit' => 1]);
            if (count($customers->data) > 0) {
                return $customers->data[0];
            }

            // Create new customer
            return Customer::create([
                'email' => $email,
                'name' => $name ?? $email,
                'metadata' => [
                    'user_id' => $user->id ?? null,
                    'role' => $user->role ?? null,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Stripe customer creation failed', [
                'error' => $e->getMessage(),
                'email' => $email,
            ]);
            return null;
        }
    }

    /**
     * Get revenue analytics (Admin)
     */
    public function getRevenueAnalytics($startDate = null, $endDate = null): array
    {
        if (!$this->secretKey) {
            return [];
        }

        try {
            $params = ['limit' => 100];
            if ($startDate) {
                $params['created'] = ['gte' => strtotime($startDate)];
            }
            if ($endDate) {
                $params['created']['lte'] = strtotime($endDate);
            }

            $paymentIntents = PaymentIntent::all($params);

            $totalRevenue = 0;
            $successfulPayments = 0;
            $failedPayments = 0;
            $refundedAmount = 0;

            foreach ($paymentIntents->data as $pi) {
                if ($pi->status === 'succeeded') {
                    $totalRevenue += $pi->amount / 100; // Convert from cents
                    $successfulPayments++;
                } elseif ($pi->status === 'canceled' || $pi->status === 'requires_payment_method') {
                    $failedPayments++;
                }
            }

            return [
                'total_revenue' => $totalRevenue,
                'successful_payments' => $successfulPayments,
                'failed_payments' => $failedPayments,
                'refunded_amount' => $refundedAmount,
                'currency' => 'usd',
            ];
        } catch (\Exception $e) {
            Log::error('Stripe revenue analytics failed', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Get transactions list (Admin)
     */
    public function getTransactions($limit = 100, $startingAfter = null): array
    {
        if (!$this->secretKey) {
            return [];
        }

        try {
            $params = ['limit' => $limit];
            if ($startingAfter) {
                $params['starting_after'] = $startingAfter;
            }

            $paymentIntents = PaymentIntent::all($params);

            $transactions = [];
            foreach ($paymentIntents->data as $pi) {
                $transactions[] = [
                    'id' => $pi->id,
                    'amount' => $pi->amount / 100,
                    'currency' => $pi->currency,
                    'status' => $pi->status,
                    'created' => date('Y-m-d H:i:s', $pi->created),
                    'customer' => $pi->customer,
                    'metadata' => $pi->metadata->toArray(),
                ];
            }

            return $transactions;
        } catch (\Exception $e) {
            Log::error('Stripe transactions retrieval failed', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Create refund
     */
    public function createRefund(string $paymentIntentId, float $amount = null): ?Refund
    {
        if (!$this->secretKey) {
            return null;
        }

        try {
            $params = ['payment_intent' => $paymentIntentId];
            if ($amount) {
                $params['amount'] = (int)($amount * 100); // Convert to cents
            }

            $refund = Refund::create($params);

            Log::info('Stripe refund created', [
                'refund_id' => $refund->id,
                'payment_intent_id' => $paymentIntentId,
                'amount' => $amount,
            ]);

            return $refund;
        } catch (\Exception $e) {
            Log::error('Stripe refund creation failed', [
                'error' => $e->getMessage(),
                'payment_intent_id' => $paymentIntentId,
            ]);
            return null;
        }
    }

    /**
     * Get subscription details (for SaaS billing)
     */
    public function getSubscription(string $subscriptionId): ?Subscription
    {
        if (!$this->secretKey) {
            return null;
        }

        try {
            return Subscription::retrieve($subscriptionId);
        } catch (\Exception $e) {
            Log::error('Stripe subscription retrieval failed', [
                'error' => $e->getMessage(),
                'subscription_id' => $subscriptionId,
            ]);
            return null;
        }
    }

    /**
     * Get invoices (for SaaS billing)
     */
    public function getInvoices($customerId = null, $limit = 100): array
    {
        if (!$this->secretKey) {
            return [];
        }

        try {
            $params = ['limit' => $limit];
            if ($customerId) {
                $params['customer'] = $customerId;
            }

            $invoices = Invoice::all($params);

            $result = [];
            foreach ($invoices->data as $invoice) {
                $result[] = [
                    'id' => $invoice->id,
                    'amount_due' => $invoice->amount_due / 100,
                    'amount_paid' => $invoice->amount_paid / 100,
                    'status' => $invoice->status,
                    'created' => date('Y-m-d H:i:s', $invoice->created),
                    'customer' => $invoice->customer,
                ];
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('Stripe invoices retrieval failed', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }
}

