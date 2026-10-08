import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { Navbar } from "../components/Navbar";
import { useCart } from "../hooks/useCart";
import { placeOrder, confirmPayment } from "../services/checkoutApi";
import { stripePromise } from "../lib/stripe";
import { StripePaymentForm } from "../components/checkout/StripePaymentForm";

const fieldClass = "w-full px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all";
const EMPTY_ADDRESS = { fullName: "", phone: "", line: "", city: "", province: "", postalCode: "", country: "" };

export function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState("address"); // "address" | "payment"
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [clientSecret, setClientSecret] = useState(null);
  const [orderGroupId, setOrderGroupId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [syncWarning, setSyncWarning] = useState("");

  const anyOverStock = items.some((item) => item.qty > item.stock);
  const setField = (key, value) => setAddress((a) => ({ ...a, [key]: value }));

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError("");
    if (anyOverStock) {
      setError("Some items exceed available stock. Please adjust your cart before checking out.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await placeOrder(address);
      setClientSecret(res.data.clientSecret);
      setOrderGroupId(res.data.orderGroupId);
      setStep("payment");
    } catch (err) {
      setError(err.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaid = async () => {
    if (!orderGroupId) {
      // Should never happen, but if it does we want to KNOW, not silently redirect
      setSyncWarning("Payment succeeded, but we couldn't sync the order status automatically. It will update shortly.");
    } else {
      try {
        await confirmPayment(orderGroupId);
      } catch (err) {
        console.error("Payment confirmation sync failed:", err.message);
        setSyncWarning("Payment succeeded, but syncing the order status failed: " + err.message);
      }
    }

    await clearCart();

    // Still navigate either way — the payment itself succeeded, this is only about the status label syncing
    // was: navigate("/success?message=" + encodeURIComponent("Payment successful — your order is confirmed") + "&to=/");
    navigate("/success?message=" + encodeURIComponent("Payment successful — your order is confirmed") + "&to=/customer/orders");
  };

  if (items.length === 0 && step === "address") {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <p className="text-lg font-serif text-[#111111] mb-2">Your cart is empty</p>
          <Link to="/" className="text-sm text-[#C9A227] hover:underline">Continue shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 animate-fade-slide-up">
        <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-6">Checkout</h1>

        {error && (
          <div className="mb-5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm">{error}</div>
        )}
        {syncWarning && (
          <div className="mb-5 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">{syncWarning}</div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {step === "address" ? (
              <form onSubmit={handleCreateOrder} className="border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 bg-white space-y-4">
                <p className="text-sm font-medium text-[#111111] mb-1">Shipping Address</p>
                <input required value={address.fullName} onChange={(e) => setField("fullName", e.target.value)} placeholder="Full name" className={fieldClass} />
                <input required value={address.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="Phone number" className={fieldClass} />
                <input required value={address.line} onChange={(e) => setField("line", e.target.value)} placeholder="Street address" className={fieldClass} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <input required value={address.city} onChange={(e) => setField("city", e.target.value)} placeholder="City" className={fieldClass} />
                  <input required value={address.province} onChange={(e) => setField("province", e.target.value)} placeholder="Province / State" className={fieldClass} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input required value={address.postalCode} onChange={(e) => setField("postalCode", e.target.value)} placeholder="Postal code" className={fieldClass} />
                  <input required value={address.country} onChange={(e) => setField("country", e.target.value)} placeholder="Country" className={fieldClass} />
                </div>
                <button type="submit" disabled={submitting || anyOverStock} className="w-full bg-[#111111] text-white py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40">
                  {submitting ? "Creating order..." : "Continue to Payment"}
                </button>
              </form>
            ) : (
              <div className="border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 bg-white">
                <p className="text-sm font-medium text-[#111111] mb-4">Payment</p>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentForm clientSecret={clientSecret} onPaid={handlePaid} />
                </Elements>
              </div>
            )}
          </div>

          <div className="border border-[#E5E5E5] rounded-2xl bg-white h-fit">
            <div className="divide-y divide-[#E5E5E5]">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <img src={item.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#111111] truncate">{item.name}</p>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">{item.seller} · Qty {item.qty}</p>
                  </div>
                  <p className="text-sm font-medium text-[#111111] shrink-0">${(item.price * item.qty).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-[#E5E5E5]">
              <div className="flex justify-between text-sm font-medium text-[#111111]">
                <span>Total</span><span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}