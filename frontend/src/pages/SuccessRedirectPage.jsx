// frontend/src/pages/SuccessRedirectPage.jsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";
import { getSafeRedirect } from "../utils/roleUtils";

const REDIRECT_DELAY_MS = 2000;

export function SuccessRedirectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const message = searchParams.get("message") || "Success";
  const to = getSafeRedirect(searchParams.get("to"), "/");

  useEffect(() => {
    let cancelled = false;

    const syncAuth = refreshUser().catch(() => {});
    const minimumDelay = new Promise((resolve) => setTimeout(resolve, REDIRECT_DELAY_MS));

    Promise.all([syncAuth, minimumDelay]).then(() => {
      if (!cancelled) navigate(to, { replace: true });
    });

    return () => { cancelled = true; };
  }, [navigate, refreshUser, to]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#E5E5E5] p-10 text-center animate-fade-slide-up">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-2xl mx-auto mb-5">
            ✓
          </div>
          <h1 className="text-2xl font-serif text-[#111111] mb-2">{message}</h1>
          <p className="text-sm text-[#6B6B6B] mb-6">Taking you there in a moment...</p>
          <div className="w-6 h-6 border-2 border-[#E5E5E5] border-t-[#C9A227] rounded-full animate-spin mx-auto" />
        </div>
      </div>
    </div>
  );
}