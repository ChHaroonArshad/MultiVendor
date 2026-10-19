import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function ChatWithSellerButton({ sellerId, productId, orderId, label = "Chat with seller", className = "" }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!sellerId) return null;
  if (user && user.role !== "customer") return null; // sellers and admins don't start shopper chats

  const target =
    `/customer/messages?seller=${sellerId}` +
    (productId ? `&product=${productId}` : "") +
    (orderId ? `&order=${orderId}` : "");

  const handleClick = () => {
    if (!user) {
      navigate("/login", { state: { from: target } });
      return;
    }
    navigate(target);
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-xs font-medium border border-[#E5E5E5] rounded-full px-4 py-2 text-[#111111] hover:border-[#C9A227]/60 hover:-translate-y-0.5 transition-all ${className}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {label}
    </button>
  );
}