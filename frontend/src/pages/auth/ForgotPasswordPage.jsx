import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Navbar } from "../../components/Navbar";

const schema = z.object({
  email: z.string().min(1, "Email address is required.").email("Please enter a valid email address."),
});

export function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ServerError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (formData) => {
  setServerError("");
  setLoading(true);
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    // Show the same success message whether res.ok or not (backend already
    // sends a generic message on both real-user and non-existent-user cases,
    // but this guards against any unexpected non-200 too)
    setSubmitted(true);
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
          <span className="inline-block w-fit px-3 py-1 text-xs border border-[#E5E5E5] rounded-full text-[#6B6B6B] mb-8">
            Marketplace
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#111111] mb-2">Forgot password</h1>
          <p className="text-sm text-[#6B6B6B] mb-8">
            Enter your email and we'll send you a link to reset your password.
          </p>

          {submitted ? (
            <div className="max-w-sm px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm animate-fade-slide-up">
              {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-sm">
              {message && (
                <div className="mb-5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm animate-fade-slide-up">
                  {message}
                </div>
              )}
              <div className="mb-6">
                <label htmlFor="email" className="block text-xs font-medium text-[#6B6B6B] mb-1.5 ml-1">Email address</label>
                <input
                  id="email" type="email" autoComplete="email" {...register("email")} placeholder="you@example.com"
                  className={`w-full px-4 py-3 rounded-full border text-sm text-[#111111] bg-[#FAFAFA] placeholder:text-[#B0B0B0] transition-all duration-200 focus:outline-none focus:ring-2 focus:bg-white ${
                    errors.email ? "border-red-400 focus:ring-red-100" : "border-[#E5E5E5] focus:border-[#C9A227] focus:ring-[#C9A227]/15"
                  }`}
                />
                {errors.email && <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-[#111111] text-white py-3 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <p className="text-sm text-[#6B6B6B] mt-8">
            Remembered your password?{" "}
            <Link to="/login" className="text-[#C9A227] hover:underline underline-offset-2 font-medium">Sign in</Link>
          </p>
        </div>

        <div className="hidden lg:block relative m-3 rounded-2xl overflow-hidden">
         <img
  src="/auth-visual-forgot.jpg"
  alt="Marketplace shopping experience"
  className="absolute inset-0 w-full h-full object-cover"
/>
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