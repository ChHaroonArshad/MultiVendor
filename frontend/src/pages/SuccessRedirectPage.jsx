import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function SuccessRedirectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const message = searchParams.get("message") || "You're all set!";
  const redirectTo = searchParams.get("to") || "/";

  useEffect(() => {
    const timer = setTimeout(() => navigate(redirectTo, { replace: true }), 1800);
    return () => clearTimeout(timer);
  }, [navigate, redirectTo]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="text-center animate-fade-slide-up">
        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
          <span className="text-emerald-600 text-2xl">✓</span>
        </div>
        <h1 className="text-2xl font-serif text-[#111111] mb-2">{message}</h1>
        <p className="text-sm text-[#6B6B6B]">Redirecting you now...</p>
      </div>
    </div>
  );
}