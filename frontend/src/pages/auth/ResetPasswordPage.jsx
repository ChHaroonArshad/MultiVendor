import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "../../components/Navbar";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const inputClass = (hasError) =>
  `w-full px-4 py-3 pr-12 rounded-full border text-sm text-[#111111] bg-[#FAFAFA] placeholder:text-[#B0B0B0] transition-all duration-200 focus:outline-none focus:ring-2 focus:bg-white ${
    hasError ? "border-red-400 focus:ring-red-100" : "border-[#E5E5E5] focus:border-[#C9A227] focus:ring-[#C9A227]/15"
  }`;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register, handleSubmit, watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resetSchema) });

  const password = watch("password") || "";
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "1 uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "1 number", ok: /[0-9]/.test(password) },
  ];

  // After success, send the user to login automatically (cleanup makes it StrictMode-safe)
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => navigate("/login"), 5000);
    return () => clearTimeout(timer);
  }, [done, navigate]);

  const onSubmit = async (formData) => {
    setServerError("");
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: formData.password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setServerError(data.errors?.[0]?.message || data.message || "Could not reset your password. Please try again.");
        return;
      }
      setDone(true);
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

            {done ? (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-xl mb-5">
                  ✓
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif text-[#111111] mb-2">Password reset successful</h1>
                <p className="text-sm text-[#6B6B6B] mb-6 max-w-sm">
                  Your password has been updated and you've been signed out of all devices.
                  Please sign in with your new password.
                </p>
                <Link
                  to="/login"
                  className="block w-full max-w-sm text-center bg-[#111111] text-white py-3 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                >
                  Go to sign in
                </Link>
                <p className="text-xs text-[#6B6B6B] mt-4">Redirecting you automatically in a few seconds...</p>
              </>
            ) : !token ? (
              <>
                <h1 className="text-3xl sm:text-4xl font-serif text-[#111111] mb-2">Invalid reset link</h1>
                <p className="text-sm text-[#6B6B6B] mb-6">
                  This link is missing its reset token. Please request a new one.
                </p>
                <Link to="/forgot-password" className="text-sm text-[#C9A227] hover:underline underline-offset-2 font-medium">
                  Request a new reset link
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl font-serif text-[#111111] mb-2">Set a new password</h1>
                <p className="text-sm text-[#6B6B6B] mb-6">Choose a strong password you haven't used before.</p>

                {serverError && (
                  <div className="mb-5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm animate-fade-slide-up">
                    {serverError}{" "}
                    {/expired|invalid|already used/i.test(serverError) && (
                      <Link to="/forgot-password" className="underline font-medium">
                        Request a new link
                      </Link>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-sm">
                  <div className="mb-3">
                    <label htmlFor="password" className="block text-xs font-medium text-[#6B6B6B] mb-1.5 ml-1">New password</label>
                    <div className="relative">
                      <input
                        id="password" type={showPassword ? "text" : "password"} autoComplete="new-password"
                        {...register("password")} placeholder="Create a new password"
                        className={inputClass(errors.password)}
                      />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B] hover:text-[#111111]">
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.password.message}</p>}
                  </div>

                  {password && (
                    <div className="flex flex-wrap gap-2 mb-4 px-1 animate-fade-slide-up">
                      {checks.map((c) => (
                        <span key={c.label} className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors duration-200 ${
                          c.ok ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-[#E5E5E5] text-[#6B6B6B]"
                        }`}>
                          {c.ok ? "✓" : "○"} {c.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-[#6B6B6B] mb-1.5 ml-1">Confirm password</label>
                    <div className="relative">
                      <input
                        id="confirmPassword" type={showConfirm ? "text" : "password"} autoComplete="new-password"
                        {...register("confirmPassword")} placeholder="Re-enter your new password"
                        className={inputClass(errors.confirmPassword)}
                      />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B] hover:text-[#111111]">
                        {showConfirm ? "Hide" : "Show"}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
                  </div>

                  <button
                    type="submit" disabled={loading}
                    className="w-full bg-[#111111] text-white py-3 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {loading ? "Resetting..." : "Reset password"}
                  </button>
                </form>

                <p className="text-sm text-[#6B6B6B] mt-6">
                  Remembered it?{" "}
                  <Link to="/login" className="text-[#C9A227] hover:underline underline-offset-2 font-medium">Back to sign in</Link>
                </p>
              </>
            )}
          </div>

          <div className="hidden lg:block relative m-3 rounded-2xl overflow-hidden">
            <img src="/auth-visual-login.jpg" alt="Marketplace shopping experience" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-6 right-6 bg-white/95 backdrop-blur px-4 py-3 rounded-xl shadow-sm animate-float">
              <p className="text-xs font-medium text-[#111111] mb-1">Secure by design</p>
              <p className="text-[11px] text-[#6B6B6B]">Your old sessions are signed out after a reset</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}