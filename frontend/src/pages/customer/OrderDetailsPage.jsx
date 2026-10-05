// frontend/src/pages/customer/OrderDetailsPage.jsx
import { Link, useParams } from "react-router-dom";
import { OrderTimeline, EmptyState } from "./CustomerDashboard";
import { mockOrderDetails } from "../../data/customerMockData";

export function OrderDetailsPage() {
  const { orderId } = useParams();
  const order = mockOrderDetails[orderId];

  if (!order) {
    return (
      <div className="animate-fade-slide-up">
        <Link to="/customer/orders" className="text-xs text-[#6B6B6B] hover:text-[#111111]">← Back to Orders</Link>
        <div className="mt-6"><EmptyState title="Order not found" description="This order's details aren't available in the demo dataset yet." actionLabel="Back to Orders" actionTo="/customer/orders" /></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-slide-up">
      <Link to="/customer/orders" className="text-xs text-[#6B6B6B] hover:text-[#111111]">← Back to Orders</Link>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif text-[#111111]">Order {order.id}</h1>
          <p className="text-xs text-[#6B6B6B] mt-1">Placed on {order.date} · Payment {order.paymentStatus}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="text-xs font-medium border border-[#E5E5E5] px-4 py-2 rounded-full hover:border-[#C9A227]/50 transition-colors">Track Order</button>
          <button className="text-xs font-medium border border-[#E5E5E5] px-4 py-2 rounded-full hover:border-[#C9A227]/50 transition-colors">Request Return</button>
          <button className="text-xs font-medium bg-[#111111] text-white px-4 py-2 rounded-full hover:opacity-90 transition-all">Buy Again</button>
        </div>
      </div>

      <div className="border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 bg-white mb-6"><OrderTimeline status={order.status} /></div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-[#E5E5E5] rounded-2xl bg-white divide-y divide-[#E5E5E5]">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#111111] truncate">{item.name}</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{item.seller} · Qty {item.qty}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-[#111111]">${(item.price * item.qty).toFixed(2)}</p>
                  <button className="text-[11px] text-[#C9A227] hover:underline mt-1">Write Review</button>
                </div>
              </div>
            ))}
          </div>
          <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
            <p className="text-sm font-medium text-[#111111] mb-3">Shipping Address</p>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              {order.address.name}<br />{order.address.line}, {order.address.city}, {order.address.province} {order.address.postal}<br />{order.address.country} · {order.address.phone}
            </p>
          </div>
        </div>
        <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white h-fit">
          <p className="text-sm font-medium text-[#111111] mb-4">Payment Summary</p>
          <div className="space-y-2 text-xs text-[#6B6B6B]">
            <div className="flex justify-between"><span>Subtotal</span><span>${order.summary.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>${order.summary.shipping.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-${order.summary.discount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>${order.summary.tax.toFixed(2)}</span></div>
          </div>
          <div className="flex justify-between text-sm font-medium text-[#111111] border-t border-[#E5E5E5] mt-3 pt-3"><span>Total</span><span>${order.summary.total.toFixed(2)}</span></div>
          <button className="w-full mt-5 text-xs font-medium border border-red-200 text-red-500 py-2.5 rounded-full hover:bg-red-50 transition-colors">Cancel Order</button>
        </div>
      </div>
    </div>
  );
}