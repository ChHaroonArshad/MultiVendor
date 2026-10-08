import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSellerOrder, updateOrderStatus } from "../../services/sellerOrderApi";
import { OrderStatusBadge } from "../../components/seller/OrderStatusBadge";
import { Avatar } from "../../components/ui/Avatar";
import { CopyButton } from "../../components/ui/CopyButton";
import { ConfirmActionModal } from "../../components/ui/ConfirmActionModal";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../context/ToastContext";
import { shortOrderId } from "../../utils/orderUtils";

export function SellerOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getSellerOrder(id)
      .then((res) => { if (!cancelled) setOrder(res.data.order); })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load order."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const changeStatus = async (nextStatus, message) => {
    setUpdating(true);
    try {
      const res = await updateOrderStatus(id, nextStatus);
      setOrder(res.data.order);
      showToast(message);
    } catch (err) {
      showToast(err.message || "Failed to update order.", "error");
    } finally {
      setUpdating(false);
      setCancelOpen(false);
    }
  };

  if (loading) {
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
        <button onClick={() => navigate("/seller/orders")} className="text-xs font-medium text-[#C9A227] hover:underline">← Back to Orders</button>
      </div>
    );
  }

  const address = order.shippingAddress;

  return (
    <div className="animate-fade-slide-up max-w-4xl space-y-5">
      <button onClick={() => navigate("/seller/orders")} className="text-xs text-[#6B6B6B] hover:text-[#111111]">← Back to Orders</button>

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

        <div className="flex gap-2 shrink-0">
          {order.status === "processing" && (
            <>
              <button onClick={() => changeStatus("shipped", "Order marked as shipped")} disabled={updating} className="text-sm font-medium px-5 py-2.5 rounded-full bg-[#111111] text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">
                {updating && <Spinner size={13} />}
                Mark as shipped
              </button>
              <button onClick={() => setCancelOpen(true)} disabled={updating} className="text-sm font-medium px-5 py-2.5 rounded-full border border-[#E5E5E5] text-[#C0392B] hover:border-[#C0392B]/50 transition-colors disabled:opacity-50">
                Cancel & refund
              </button>
            </>
          )}
          {order.status === "shipped" && (
            <button onClick={() => changeStatus("delivered", "Order marked as delivered")} disabled={updating} className="text-sm font-medium px-5 py-2.5 rounded-full bg-[#111111] text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">
              {updating && <Spinner size={13} />}
              Mark as delivered
            </button>
          )}
        </div>
      </div>

      {order.paymentStatus === "refunded" && (
        <div className="border border-[#E5E5E5] bg-[#F3EAFB] rounded-2xl px-4 py-3">
          <p className="text-sm text-[#7B3FA8]">${order.subtotal.toFixed(2)} was refunded to the customer and the items were returned to stock.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
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

      <ConfirmActionModal
        open={cancelOpen}
        danger
        title={`Cancel order #${shortOrderId(order._id)}?`}
        message={`This refunds $${order.subtotal.toFixed(2)} to the customer and puts the items back in stock. This can't be undone.`}
        confirmLabel="Cancel & refund"
        loading={updating}
        onConfirm={() => changeStatus("cancelled", "Order cancelled and refunded to the customer")}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}