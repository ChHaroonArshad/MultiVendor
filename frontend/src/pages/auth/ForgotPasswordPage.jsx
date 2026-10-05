// pages/auth/ForgotPasswordPage.jsx — full replacement
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Navbar } from "../../components/Navbar";

const forgotSchema = z.object({
  email: z.string().trim().min(1, "Email address is required.").email("Please enter a valid email address."),
});

export function ForgotPasswordPage() {
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState(""); // also doubles as the "done" flag

  const {
    register, handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async (formData) => {
    setServerError("");
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      // Backend always answers generically (anti-enumeration), so we show the
      // same success screen regardless — only a real network failure hits catch.
      await res.json().catch(() => ({}));
      setSubmittedEmail(formData.email);
    } catch {
      setServerError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-sm border border-[#E5E5E5] overflow-hidden grid lg:grid-cols-2 animate-fade-slide-up">
          <div className="px-8 py-10 sm:px-14 sm:py-14 flex flex-col justify-center">
            <span className="inline-block w-fit px-3 py-1 text-xs border border-[#E5E5E5] rounded-full text-[#6B6B6B] mb-6">
              Marketplace
            </span>

            {submittedEmail ? (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-xl mb-5">
                  ✓
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif text-[#111111] mb-2">Check your email</h1>
                <p className="text-sm text-[#6B6B6B] mb-1 max-w-sm">If an account exists for</p>
                <p className="text-sm font-medium text-[#111111] mb-4 max-w-sm break-all">{submittedEmail}</p>
                <p className="text-sm text-[#6B6B6B] mb-6 max-w-sm">
                  we've sent a link to reset your password. The link expires in 1 hour.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedEmail("")}
                  className="text-sm text-[#C9A227] hover:underline underline-offset-2 font-medium text-left w-fit"
                >
                  Try a different email
                </button>
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl font-serif text-[#111111] mb-2">Forgot password</h1>
                <p className="text-sm text-[#6B6B6B] mb-6 max-w-sm">
                  Enter your email and we'll send you a link to reset your password.
                </p>

                {serverError && (
                  <div className="mb-5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm animate-fade-slide-up">
                    {serverError}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-sm">
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-xs font-medium text-[#6B6B6B] mb-1.5 ml-1">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...register("email")}
                      placeholder="you@example.com"
                      className={`w-full px-4 py-3 rounded-full border text-sm text-[#111111] bg-[#FAFAFA] placeholder:text-[#B0B0B0] transition-all duration-200 focus:outline-none focus:ring-2 focus:bg-white ${
                        errors.email ? "border-red-400 focus:ring-red-100" : "border-[#E5E5E5] focus:border-[#C9A227] focus:ring-[#C9A227]/15"
                      }`}
                    />
                    {errors.email && <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.email.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#111111] text-white py-3 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {loading ? "Sending..." : "Send reset link"}
                  </button>
                </form>
              </>
            )}

            <p className="text-sm text-[#6B6B6B] mt-6">
              Remembered your password?{" "}
              <Link to="/login" className="text-[#C9A227] hover:underline underline-offset-2 font-medium">Sign in</Link>
            </p>
          </div>

          <div className="hidden lg:block relative m-3 rounded-2xl overflow-hidden">
            <img src="/auth-visual-forgot.jpg" alt="Marketplace shopping experience" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-6 right-6 bg-white/95 backdrop-blur px-4 py-3 rounded-xl shadow-sm animate-float">
              <p className="text-xs font-medium text-[#111111] mb-1">Your account is protected</p>
              <p className="text-[11px] text-[#6B6B6B]">Reset links expire for your security</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}