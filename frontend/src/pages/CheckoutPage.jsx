import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useCart } from "../hooks/useCart";

export function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const handlePlaceOrder = () => {
    clearCart();
    navigate("/success?message=" + encodeURIComponent("Order placed successfully") + "&to=/");
  };

  if (items.length === 0) {
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
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-[#E5E5E5] rounded-2xl bg-white divide-y divide-[#E5E5E5]">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#111111] truncate">{item.name}</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{item.seller} · Qty {item.qty}</p>
                </div>
                <p className="text-sm font-medium text-[#111111] shrink-0">${(item.price * item.qty).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white h-fit">
            <p className="text-sm font-medium text-[#111111] mb-4">Order Summary</p>
            <div className="flex justify-between text-sm font-medium text-[#111111] border-t border-[#E5E5E5] pt-3 mb-5">
              <span>Total</span><span>${totalPrice.toFixed(2)}</span>
            </div>
            <button onClick={handlePlaceOrder} className="w-full bg-[#111111] text-white py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all">Place Order</button>
          </div>
        </div>
      </div>
    </div>
  );
}