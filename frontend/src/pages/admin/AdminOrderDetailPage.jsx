import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminOrder } from "../../services/adminOrderApi";
import { OrderStatusBadge } from "../../components/seller/OrderStatusBadge";
import { Avatar } from "../../components/ui/Avatar";
import { CopyButton } from "../../components/ui/CopyButton";
import { Spinner } from "../../components/ui/Spinner";
import { shortOrderId, formatMoney } from "../../utils/orderUtils";

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-[#6B6B6B] shrink-0">{label}</span>
      <span className="text-[#111111] text-right min-w-0">{children}</span>
    </div>
  );
}

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getAdminOrder(id)
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load order."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-2">
        <Spinner size={16} className="text-[#6B6B6B]" />
        <p className="text-sm text-[#6B6B6B]">Loading order...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-600 mb-3">{error || "Order not found."}</p>
        <button onClick={() => navigate("/admin/orders")} className="text-xs font-medium text-[#C9A227] hover:underline">← Back to Orders</button>
      </div>
    );
  }

  const { order, siblings } = data;
  const address = order.shippingAddress;
  const checkoutTotal = order.subtotal + siblings.reduce((sum, s) => sum + s.subtotal, 0);

  return (
    <div className="max-w-5xl space-y-5">
      <button onClick={() => navigate("/admin/orders")} className="text-xs text-[#6B6B6B] hover:text-[#111111]">← Back to Orders</button>

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <h1 className="text-xl font-serif text-[#111111]">Order #{shortOrderId(order._id)}</h1>
          <CopyButton text={order._id} toastMessage="Order ID copied" label="Copy order ID" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <OrderStatusBadge status={order.status} />
          <OrderStatusBadge status={order.paymentStatus} />
          <span className="text-xs text-[#6B6B6B]">Placed {new Date(order.createdAt).toLocaleString()}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
          <p className="text-xs text-[#6B6B6B] mb-3">Customer</p>
          <div className="flex items-center gap-3">
            <Avatar name={order.buyer?.name} src={order.buyer?.avatar} size={40} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#111111] truncate">{order.buyer?.name || "Deleted user"}</p>
              <p className="text-xs text-[#6B6B6B] truncate">{order.buyer?.email}</p>
            </div>
          </div>
        </div>

        <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
          <p className="text-xs text-[#6B6B6B] mb-3">Seller</p>
          <div className="flex items-center gap-3">
            <Avatar name={order.seller?.name} src={order.seller?.avatar} size={40} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#111111] truncate">{order.seller?.name || "Deleted user"}</p>
              <p className="text-xs text-[#6B6B6B] truncate">{order.seller?.email}</p>
            </div>
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
                <p className="text-xs text-[#6B6B6B] mt-0.5">{formatMoney(item.price)} × {item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-[#111111] shrink-0">{formatMoney(item.subtotal)}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-medium text-[#111111] px-5 py-4 border-t border-[#E5E5E5] bg-[#FAFAFA]">
          <span>Order total</span>
          <span>{formatMoney(order.subtotal)}</span>
        </div>
      </div>

      <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white space-y-3">
        <p className="text-xs text-[#6B6B6B]">Payment details</p>
        <InfoRow label="Payment status"><OrderStatusBadge status={order.paymentStatus} /></InfoRow>
        <InfoRow label="Whole checkout charged">{formatMoney(checkoutTotal)}</InfoRow>
        <InfoRow label="Stripe payment">
          {order.stripePaymentIntentId ? (
            <span className="inline-flex items-center gap-1">
              <span className="font-mono text-xs break-all">{order.stripePaymentIntentId}</span>
              <CopyButton text={order.stripePaymentIntentId} toastMessage="Payment ID copied" label="Copy payment ID" />
            </span>
          ) : "—"}
        </InfoRow>
        {order.stripeRefundId && (
          <InfoRow label="Stripe refund">
            <span className="inline-flex items-center gap-1">
              <span className="font-mono text-xs break-all">{order.stripeRefundId}</span>
              <CopyButton text={order.stripeRefundId} toastMessage="Refund ID copied" label="Copy refund ID" />
            </span>
          </InfoRow>
        )}
        <InfoRow label="Checkout group">
          <span className="inline-flex items-center gap-1">
            <span className="font-mono text-xs break-all">{order.orderGroupId}</span>
            <CopyButton text={order.orderGroupId} toastMessage="Checkout ID copied" label="Copy checkout ID" />
          </span>
        </InfoRow>
      </div>

      {siblings.length > 0 && (
        <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden">
          <p className="text-xs text-[#6B6B6B] px-5 py-3 border-b border-[#E5E5E5]">Other orders from the same checkout</p>
          <div className="divide-y divide-[#E5E5E5]">
            {siblings.map((s) => (
              <button
                key={s._id}
                onClick={() => navigate(`/admin/orders/${s._id}`)}
                className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-[#FAFAFA] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#111111]">#{shortOrderId(s._id)}</p>
                  <p className="text-xs text-[#6B6B6B] truncate">{s.seller?.name || "Deleted user"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <OrderStatusBadge status={s.paymentStatus} />
                  <OrderStatusBadge status={s.status} />
                  <span className="text-sm font-medium text-[#111111] w-20 text-right">{formatMoney(s.subtotal)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}