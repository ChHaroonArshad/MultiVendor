import { useCart } from "../hooks/useCart";

export function CartToast() {
  const { toast } = useCart();
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-[#111111] text-white text-sm px-5 py-3 rounded-full shadow-lg flex items-center gap-2 animate-toast-in">
      <span className="text-[#C9A227]">✓</span>
      {toast}
    </div>
  );
}