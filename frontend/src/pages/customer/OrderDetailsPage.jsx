import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { getMyOrder } from "../../services/customerOrderApi";
import { retryPayment, confirmPayment } from "../../services/checkoutApi";
import { stripePromise } from "../../lib/stripe";
import { StripePaymentForm } from "../../components/checkout/StripePaymentForm";
import { OrderStatusBadge } from "../../components/seller/OrderStatusBadge";
import { Avatar } from "../../components/ui/Avatar";
import { CopyButton } from "../../components/ui/CopyButton";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../context/ToastContext";
import { shortOrderId } from "../../utils/orderUtils";

const needsRepayment = (order) => order?.status === "pending" && order?.paymentStatus === "unpaid";

export function OrderDetailsPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [clientSecret, setClientSecret] = useState(null);
  const [payAmount, setPayAmount] = useState(null);
  const [startingPayment, setStartingPayment] = useState(false);
  const autoStartedRef = useRef(false);

  const loadOrder = () => {
    setLoading(true);
    setError("");
    return getMyOrder(orderId)
      .then((res) => setOrder(res.data.order))
      .catch((err) => setError(err.message || "Failed to load order."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    getMyOrder(orderId)
      .then((res) => { if (!cancelled) setOrder(res.data.order); })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load order."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId]);

  const handleStartPayment = async () => {
    setStartingPayment(true);
    try {
      const res = await retryPayment(order.orderGroupId);
      setClientSecret(res.data.clientSecret);
      setPayAmount(res.data.amount);
    } catch (err) {
      showToast(err.message || "Could not start payment. This order may have expired.", "error");
    } finally {
      setStartingPayment(false);
    }
  };

  // Arriving from the "Repayment" button (?pay=1): start the payment automatically, once.
  useEffect(() => {
    if (!order || autoStartedRef.current) return;
    if (searchParams.get("pay") === "1" && needsRepayment(order)) {
      autoStartedRef.current = true;
      handleStartPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const handlePaid = async () => {
    try {
      await confirmPayment(order.orderGroupId); // ask our backend to re-check Stripe right away
    } catch {
      // the webhook / cleanup job will still catch it, so this is not fatal
    }
    showToast("Payment successful — your order is confirmed");
    setClientSecret(null);
    setPayAmount(null);
    loadOrder();
  };

  if (loading && !order) {
    return (
      <div className="py-16 flex items-center justify-center gap-2">
        <Spinner size={16} className="text-[#6B6B6B]" />
        <p className="text-sm text-[#6B6B6B]">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-600 mb-3">{error || "Order not found."}</p>
        <button onClick={() => navigate("/customer/orders")} className="text-xs font-medium text-[#C9A227] hover:underline">← Back to Orders</button>
      </div>
    );
  }

  const address = order.shippingAddress;

  return (
    <div className="animate-fade-slide-up max-w-4xl space-y-5">
      <button onClick={() => navigate("/customer/orders")} className="text-xs text-[#6B6B6B] hover:text-[#111111]">← Back to Orders</button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-2xl font-serif text-[#111111]">Order #{shortOrderId(order._id)}</h1>
            <CopyButton text={order._id} toastMessage="Order ID copied" label="Copy order ID" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <OrderStatusBadge status={order.status} />
            <OrderStatusBadge status={order.paymentStatus} />
            <span className="text-xs text-[#6B6B6B]">Placed {new Date(order.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {needsRepayment(order) && !clientSecret && (
          <button
            onClick={handleStartPayment}
            disabled={startingPayment}
            className="text-sm font-medium px-5 py-2.5 rounded-full bg-[#111111] text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            {startingPayment && <Spinner size={13} />}
            {startingPayment ? "Preparing payment..." : "Complete Payment"}
          </button>
        )}
      </div>

      {clientSecret && (
        <div className="border border-[#C9A227]/40 bg-[#FBF6E9] rounded-2xl p-5 sm:p-6">
          <p className="text-sm font-medium text-[#111111] mb-1">
            Complete your payment — ${(payAmount ?? order.subtotal).toFixed(2)}
          </p>
          <p className="text-xs text-[#6B6B6B] mb-4">
            This covers every item from this checkout, including orders from other sellers.
          </p>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripePaymentForm clientSecret={clientSecret} onPaid={handlePaid} />
          </Elements>
        </div>
      )}

      {order.paymentStatus === "refunded" && (
        <div className="border border-[#E5E5E5] bg-[#F3EAFB] rounded-2xl px-4 py-3">
          <p className="text-sm text-[#7B3FA8]">${order.subtotal.toFixed(2)} was refunded to you and the seller restocked these items.</p>
        </div>
      )}

      {order.status === "cancelled" && order.paymentStatus === "unpaid" && (
        <div className="border border-[#E5E5E5] bg-[#FAFAFA] rounded-2xl px-4 py-3">
          <p className="text-sm text-[#6B6B6B]">This order expired before payment was completed. <Link to="/" className="text-[#C9A227] hover:underline">Shop again</Link> to place a new order.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
          <p className="text-xs text-[#6B6B6B] mb-3">Sold by</p>
          <div className="flex items-center gap-3">
            <Avatar name={order.seller?.name} size={40} />
            <p className="text-sm font-medium text-[#111111] truncate">{order.seller?.name || "Unknown seller"}</p>
          </div>
        </div>

        <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
          <p className="text-xs text-[#6B6B6B] mb-3">Shipping address</p>
          <p className="text-sm font-medium text-[#111111]">{address.fullName}</p>
          <p className="text-sm text-[#6B6B6B]">{address.line}</p>
          <p className="text-sm text-[#6B6B6B]">{address.city}, {address.province} {address.postalCode}</p>
          <p className="text-sm text-[#6B6B6B]">{address.country}</p>
          <p className="text-sm text-[#6B6B6B] mt-1">{address.phone}</p>
        </div>
      </div>

      <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden">
        <p className="text-xs text-[#6B6B6B] px-5 py-3 border-b border-[#E5E5E5]">Items</p>
        <div className="divide-y divide-[#E5E5E5]">
          {order.items.map((item, i) => (
            <div key={`${item.product}-${i}`} className="flex items-center gap-4 p-4">
              <img src={item.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 bg-[#FAFAFA]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#111111] truncate">{item.name}</p>
                <p className="text-xs text-[#6B6B6B] mt-0.5">${item.price.toFixed(2)} × {item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-[#111111] shrink-0">${item.subtotal.toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-medium text-[#111111] px-5 py-4 border-t border-[#E5E5E5] bg-[#FAFAFA]">
          <span>Total</span>
          <span>${order.subtotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}