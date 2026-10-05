import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";

export function CartDrawer() {
  const { items, totalPrice, drawerOpen, closeDrawer, removeItem, updateQty } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeDrawer();
    navigate("/checkout");
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeDrawer}
      />
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-[#E5E5E5] shrink-0">
          <p className="text-lg font-serif text-[#111111]">Your Cart</p>
          <button onClick={closeDrawer} aria-label="Close cart" className="w-9 h-9 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center text-xl mb-4">🛍️</div>
              <p className="text-sm font-medium text-[#111111] mb-1">Your cart is empty</p>
              <p className="text-xs text-[#6B6B6B]">Add products you love and they'll show up here.</p>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 animate-fade-slide-up">
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#111111] truncate">{item.name}</p>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">{item.seller}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 border border-[#E5E5E5] rounded-full px-1">
                        <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-6 h-6 text-sm text-[#111111]">−</button>
                        <span className="text-xs w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-6 h-6 text-sm text-[#111111]">+</button>
                      </div>
                      <span className="text-sm font-medium text-[#111111]">${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-[11px] text-red-500 hover:underline mt-2">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[#E5E5E5] px-6 py-5 shrink-0">
            <div className="flex items-center justify-between text-sm font-medium text-[#111111] mb-1">
              <span>Total</span><span>${totalPrice.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-[#6B6B6B] mb-4">Shipping calculated at checkout</p>
            <div className="flex gap-2">
              {/* <button onClick={closeDrawer} className="flex-1 text-sm font-medium border border-[#E5E5E5] py-3 rounded-full hover:border-[#C9A227]/50 transition-colors">View Cart</button> */}
              <button onClick={handleCheckout} className="flex-1 text-sm font-medium bg-[#111111] text-white py-3 rounded-full hover:opacity-90 transition-all">Checkout</button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}