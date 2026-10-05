// frontend/src/pages/customer/BasketPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "./CustomerDashboard";
import { mockBasket as initialBasket } from "../../data/customerMockData";

export function BasketPage() {
  const [basket, setBasket] = useState(initialBasket);

  const updateQty = (sellerName, itemId, delta) =>
    setBasket((groups) => groups.map((g) => (g.seller !== sellerName ? g : { ...g, items: g.items.map((i) => (i.id === itemId ? { ...i, qty: Math.max(1, i.qty + delta) } : i)) })));

  const removeItem = (sellerName, itemId) =>
    setBasket((groups) => groups.map((g) => (g.seller !== sellerName ? g : { ...g, items: g.items.filter((i) => i.id !== itemId) })).filter((g) => g.items.length > 0));

  const allItems = basket.flatMap((g) => g.items);
  const subtotal = allItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = allItems.length > 0 ? 9.5 : 0;
  const discount = 10;
  const total = Math.max(0, subtotal + shipping - discount);

  return (
    <div className="animate-fade-slide-up">
      <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Basket</h1>
      <p className="text-sm text-[#6B6B6B] mb-6">{allItems.length} item{allItems.length !== 1 ? "s" : ""} from {basket.length} seller{basket.length !== 1 ? "s" : ""}</p>

      {allItems.length === 0 ? (
        <EmptyState title="Your basket is waiting for something great" description="Add products you love and they'll show up here." actionLabel="Start Shopping" actionTo="/" />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {basket.map((group) => (
              <div key={group.seller} className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden">
                <p className="text-xs font-medium text-[#6B6B6B] px-5 py-3 border-b border-[#E5E5E5] bg-[#FAFAFA]">Seller: <span className="text-[#111111]">{group.seller}</span></p>
                <div className="divide-y divide-[#E5E5E5]">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4">
                      <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#111111] truncate">{item.name}</p>
                        <p className="text-xs text-[#6B6B6B] mt-0.5">${item.price} each</p>
                        <button onClick={() => removeItem(group.seller, item.id)} className="text-[11px] text-red-500 hover:underline mt-1.5">Remove</button>
                      </div>
                      <div className="flex items-center gap-2 border border-[#E5E5E5] rounded-full px-1">
                        <button onClick={() => updateQty(group.seller, item.id, -1)} className="w-6 h-6 text-sm text-[#111111]">−</button>
                        <span className="text-xs w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(group.seller, item.id, 1)} className="w-6 h-6 text-sm text-[#111111]">+</button>
                      </div>
                      <p className="text-sm font-medium text-[#111111] w-16 text-right shrink-0">${(item.price * item.qty).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Link to="/" className="inline-block text-xs text-[#C9A227] hover:underline">← Continue Shopping</Link>
          </div>
          <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white h-fit">
            <p className="text-sm font-medium text-[#111111] mb-4">Order Summary</p>
            <div className="space-y-2 text-xs text-[#6B6B6B]">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>${shipping.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>
            </div>
            <div className="flex justify-between text-sm font-medium text-[#111111] border-t border-[#E5E5E5] mt-3 pt-3 mb-5"><span>Estimated Total</span><span>${total.toFixed(2)}</span></div>
            <button className="w-full text-sm font-medium bg-[#111111] text-white py-3 rounded-full hover:opacity-90 transition-all">Proceed to Checkout</button>
          </div>
        </div>
      )}
    </div>
  );
}