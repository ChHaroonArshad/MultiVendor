import { useLocation, useNavigate } from "react-router-dom";

export function LoginRequiredModal({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-slide-up"
      onClick={onClose}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E5E5] p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-11 h-11 mx-auto rounded-full bg-[#FBF6E9] border border-[#C9A227]/40 flex items-center justify-center text-[#C9A227] text-lg mb-4">🔒</div>
        <p className="text-sm font-medium text-[#111111] mb-1">Sign in to continue</p>
        <p className="text-xs text-[#6B6B6B] mb-5">Create an account or sign in to add items to your cart and check out.</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate("/login", { state: { from: location.pathname } })}
            className="w-full bg-[#111111] text-white py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200"
          >
            Sign In
          </button>
          <button onClick={onClose} className="w-full border border-[#E5E5E5] py-2.5 rounded-full text-sm font-medium text-[#111111] hover:border-[#C9A227]/50 transition-colors">
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}