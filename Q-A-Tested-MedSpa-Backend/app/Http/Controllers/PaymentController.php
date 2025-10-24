<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\AuditLog;
use App\Models\Client;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use PDF; // barryvdh/laravel-dompdf

class PaymentController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(env('STRIPE_SECRET'));
    }

    // List all payments (Admin/Provider)
    public function index()
    {
        try {
            $user = auth()->user();
            $query = Payment::with(['client.clientUser', 'appointment', 'package']);

            if ($user->role === 'client') {
                $client = Client::where('user_id', $user->id)->first();
                if ($client) $query->where('client_id', $client->id);
            }

            return response()->json($query->get());
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch payments', 'error' => $e->getMessage()], 500);
        }
    }

    // Client → view own payments
    public function myPayments()
    {
        try {
            $user = auth()->user();
            $client = Client::where('user_id', $user->id)->first();
            if (!$client) return response()->json(['message' => 'Client profile not found'], 404);

            $payments = Payment::with(['appointment','package'])->where('client_id', $client->id)->get();
            return response()->json($payments);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch client payments','error' => $e->getMessage()], 500);
        }
    }

    // Store a new payment (cash or Stripe)
    public function store(Request $request)
    {
        try {
            $request->validate([
                'client_id'      => 'required|exists:clients,id',
                'appointment_id' => 'nullable|exists:appointments,id',
                'package_id'     => 'nullable|exists:packages,id',
                'amount'         => 'required|numeric|min:1',
                'payment_method' => 'required|in:stripe,cash',
                'tips'           => 'nullable|numeric',
                'status'         => 'required|in:pending,completed,canceled',
            ]);

            $client = Client::find($request->client_id);
            if (!$client) return response()->json(['message'=>'Client not found','error'=>'Invalid client_id'],404);

            // 🔹 Fixed Commission % Rule
            $commissionRate = config('medspa.commission_rate', 20); // default 20%
            $commission = ($request->amount * $commissionRate) / 100;

            if ($request->payment_method === 'stripe') {
                // Stripe payment
                Stripe::setApiKey(env('STRIPE_SECRET'));
                $paymentIntent = PaymentIntent::create([
                    'amount' => $request->amount * 100,
                    'currency' => 'usd',
                    'payment_method_types' => ['card'],
                ]);

                $payment = Payment::create([
                    'client_id'      => $client->id,
                    'appointment_id' => $request->appointment_id,
                    'package_id'     => $request->package_id,
                    'amount'         => $request->amount,
                    'payment_method' => 'stripe',
                    'status'         => 'pending',
                    'tips'           => $request->tips ?? 0,
                    'commission'     => $commission,
                ]);

                AuditLog::create([
                    'user_id'    => auth()->id(),
                    'action'     => 'create',
                    'table_name' => 'payments',
                    'record_id'  => $payment->id,
                    'new_data'   => json_encode($payment),
                ]);

                return response()->json([
                    'message' => 'Stripe payment initiated',
                    'client_secret' => $paymentIntent->client_secret,
                    'payment' => $payment->load(['client.clientUser','appointment','package']),
                ], 201);

            } else {
                // Cash payment
                $payment = Payment::create([
                    'client_id'      => $client->id,
                    'appointment_id' => $request->appointment_id,
                    'package_id'     => $request->package_id,
                    'amount'         => $request->amount,
                    'payment_method' => 'cash',
                    'status'         => 'completed',
                    'tips'           => $request->tips ?? 0,
                    'commission'     => $commission,
                ]);

                AuditLog::create([
                    'user_id'    => auth()->id(),
                    'action'     => 'create',
                    'table_name' => 'payments',
                    'record_id'  => $payment->id,
                    'new_data'   => json_encode($payment),
                ]);

                return response()->json([
                    'message' => 'Cash payment completed',
                    'payment' => $payment->load(['client.clientUser','appointment','package']),
                ], 201);
            }

        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create payment','error'=>$e->getMessage()],500);
        }
    }

    // Confirm Stripe payment
    public function confirmStripePayment(Request $request, $paymentId)
    {
        try {
            $request->validate(['payment_intent_id'=>'required|string']);
            $payment = Payment::find($paymentId);
            if (!$payment || $payment->payment_method !== 'stripe') {
                return response()->json(['message'=>'Stripe payment not found'],404);
            }

            Stripe::setApiKey(env('STRIPE_SECRET'));
            $paymentIntent = PaymentIntent::retrieve($request->payment_intent_id);

            if ($paymentIntent->status === 'succeeded') {
                $payment->status = 'completed';
                $payment->save();

                AuditLog::create([
                    'user_id'=>auth()->id(),
                    'action'=>'update',
                    'table_name'=>'payments',
                    'record_id'=>$payment->id,
                    'new_data'=>json_encode($payment),
                ]);

                return response()->json([
                    'message'=>'Payment completed successfully',
                    'payment'=>$payment->load(['client.clientUser','appointment','package'])
                ],200);
            } else {
                return response()->json(['message'=>'Payment not completed','status'=>$paymentIntent->status],400);
            }
        } catch (\Exception $e) {
            return response()->json(['message'=>'Failed to confirm Stripe payment','error'=>$e->getMessage()],500);
        }
    }

    // Generate Payment Receipt PDF
    public function generateReceipt($paymentId)
    {
        $payment = Payment::with(['client.clientUser', 'appointment', 'package'])->find($paymentId);

        if (!$payment) {
            return response()->json(['message'=>'Payment not found'],404);
        }

        $pdf = PDF::loadView('payments.receipt', compact('payment'));

        // Save PDF locally (optional)
        $filename = 'payment_receipt_'.$payment->id.'.pdf';
        $path = storage_path('app/public/receipts/'.$filename);
        $pdf->save($path);

        return $pdf->download($filename); // Direct download
    }

    // 🔹 Other methods: show, update, destroy remain unchanged
}
