"use client";

import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Loader2, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { notify } from "@/lib/toast";
import { confirmStripePayment } from "@/lib/api";

// Initialize Stripe - use publishable key from env or default test key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_51..."
);

const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#9e2146",
    },
  },
};

function CheckoutForm({ clientSecret, paymentId, amount, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        notify.error(`Payment failed: ${stripeError.message}`);
        setProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Confirm payment in backend
        try {
          await confirmStripePayment(paymentId, paymentIntent.id);
          
          console.log("✅ Payment Successful", {
            paymentIntentId: paymentIntent.id,
            amount: amount,
          });
          
          setSucceeded(true);
          notify.success("Payment completed successfully!");
          
          // Call success callback after a brief delay
          setTimeout(() => {
            if (onSuccess) onSuccess(paymentIntent);
          }, 1500);
        } catch (confirmError) {
          console.error("Error confirming payment:", confirmError);
          setError("Payment processed but confirmation failed. Please check with administrator.");
          notify.error("Payment confirmation failed. Please contact support.");
          setProcessing(false);
        }
      } else {
        setError("Payment was not completed. Please try again.");
        notify.error("Payment was not completed.");
        setProcessing(false);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "An error occurred during payment processing.");
      notify.error("Payment processing failed. Please try again.");
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <div className="text-center p-6 space-y-4">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="text-lg font-semibold">Payment Successful!</h3>
        <p className="text-sm text-muted-foreground">
          Your payment has been processed successfully.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="card-element" className="mb-2 block">
          Card Details
        </Label>
        <div className="p-3 border border-input rounded-md bg-background">
          <CardElement id="card-element" options={cardElementOptions} />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      <div className="flex space-x-2">
        <Button
          type="submit"
          className="flex-1"
          disabled={!stripe || processing}
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Your payment information is secure and encrypted
      </p>
    </form>
  );
}

export function StripePaymentForm({ clientSecret, paymentId, amount, onSuccess, onCancel }) {
  if (!clientSecret) {
    return (
      <div className="text-center p-6">
        <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <p className="text-sm text-muted-foreground">
          Payment initialization failed. Please try again.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        clientSecret={clientSecret}
        paymentId={paymentId}
        amount={amount}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}

