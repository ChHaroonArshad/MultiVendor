import { useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";

const cardElementOptions = {
  style: {
    base: { fontSize: "14px", color: "#111111", "::placeholder": { color: "#B0B0B0" } },
    invalid: { color: "#C0392B" },
  },
};

// clientSecret ab DIRECTLY prop se aata hai — Stripe ke internal object se nahi nikaala jata
export function StripePaymentForm({ clientSecret, onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setSubmitting(true);
    setError("");

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (stripeError) {
        setError(stripeError.message);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        onPaid();
      } else {
        setError("Payment did not complete. Please try again.");
      }
    } catch (err) {
      // Yahi try/catch missing thi — ab koi bhi unexpected error "Processing..." mein
      // hamesha ke liye nahi atkega, user ko turant error dikh jayega
      setError(err.message || "Something went wrong while processing payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="border border-[#E5E5E5] rounded-xl px-4 py-3.5 bg-[#FAFAFA]">
        <CardElement options={cardElementOptions} />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full bg-[#111111] text-white py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40"
      >
        {submitting ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}