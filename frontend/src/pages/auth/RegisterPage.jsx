import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../../components/Navbar";

const registerSchema = z
  .object({
    name: z.string().min(1, "Please enter your full name.").min(2, "Name must be at least 2 characters."),
    email: z.string().min(1, "Email address is required.").email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
    role: z.enum(["customer", "seller"], { errorMap: () => ({ message: "Please select how you'll use the marketplace." }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema), defaultValues: { role: "customer" } });

  const selectedRole = watch("role");
  const password = watch("password") || "";

  const onSubmit = async (formData) => {
    setServerError("");
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password, role: formData.role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.message || "Registration failed. Please try again.");
        return;
      }
      navigate("/verify-email");
    } catch {
      setServerError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "1 uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "1 number", ok: /[0-9]/.test(password) },
  ];

  return (
<div className="min-h-screen bg-[#FAFAFA] flex flex-col">
  <Navbar />
  <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
    <div className="w-full max-w-5xl bg-white rounded-3xl shadow-sm border border-[#E5E5E5] overflow-hidden grid lg:grid-cols-2 animate-fade-slide-up">
        <div className="px-8 py-10 sm:px-14 sm:py-14 flex flex-col justify-center">
          <span className="inline-block w-fit px-3 py-1 text-xs border border-[#E5E5E5] rounded-full text-[#6B6B6B] mb-6">
            Marketplace
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#111111] mb-2">Create your account</h1>
          <p className="text-sm text-[#6B6B6B] mb-6">Join our marketplace and discover products from trusted sellers.</p>

          {serverError && (
            <div className="mb-5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm animate-fade-slide-up">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-sm">
            {/* Role selection */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {["customer", "seller"].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setValue("role", role, { shouldValidate: true })}
                  className={`text-left p-3.5 rounded-2xl border transition-all duration-200 ${
                    selectedRole === role
                      ? "border-[#C9A227] bg-[#FBF6E9] scale-[1.02] shadow-sm"
                      : "border-[#E5E5E5] hover:border-[#C9A227]/40"
                  }`}
                >
                  <p className="text-sm font-semibold text-[#111111] capitalize mb-0.5">{role}</p>
                  <p className="text-[11px] text-[#6B6B6B] leading-snug">
                    {role === "customer" ? "Shop & save favorites" : "Sell & manage your store"}
                  </p>
                </button>
              ))}
            </div>
            {errors.role && <p className="mb-4 -mt-3 text-xs text-red-500">{errors.role.message}</p>}

            <div className="mb-4">
              <label htmlFor="name" className="block text-xs font-medium text-[#6B6B6B] mb-1.5 ml-1">Full name</label>
              <input
                id="name" type="text" autoComplete="name" {...register("name")} placeholder="Your full name"
                className={`w-full px-4 py-3 rounded-full border text-sm text-[#111111] bg-[#FAFAFA] placeholder:text-[#B0B0B0] transition-all duration-200 focus:outline-none focus:ring-2 focus:bg-white ${
                  errors.name ? "border-red-400 focus:ring-red-100" : "border-[#E5E5E5] focus:border-[#C9A227] focus:ring-[#C9A227]/15"
                }`}
              />
              {errors.name && <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-xs font-medium text-[#6B6B6B] mb-1.5 ml-1">Email address</label>
              <input
                id="email" type="email" autoComplete="email" {...register("email")} placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-full border text-sm text-[#111111] bg-[#FAFAFA] placeholder:text-[#B0B0B0] transition-all duration-200 focus:outline-none focus:ring-2 focus:bg-white ${
                  errors.email ? "border-red-400 focus:ring-red-100" : "border-[#E5E5E5] focus:border-[#C9A227] focus:ring-[#C9A227]/15"
                }`}
              />
              {errors.email && <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="block text-xs font-medium text-[#6B6B6B] mb-1.5 ml-1">Password</label>
              <div className="relative">
                <input
                  id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" {...register("password")} placeholder="Create a password"
                  className={`w-full px-4 py-3 pr-12 rounded-full border text-sm text-[#111111] bg-[#FAFAFA] placeholder:text-[#B0B0B0] transition-all duration-200 focus:outline-none focus:ring-2 focus:bg-white ${
                    errors.password ? "border-red-400 focus:ring-red-100" : "border-[#E5E5E5] focus:border-[#C9A227] focus:ring-[#C9A227]/15"
                  }`}
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
                  id="confirmPassword" type={showConfirm ? "text" : "password"} autoComplete="new-password" {...register("confirmPassword")} placeholder="Re-enter your password"
                  className={`w-full px-4 py-3 pr-12 rounded-full border text-sm text-[#111111] bg-[#FAFAFA] placeholder:text-[#B0B0B0] transition-all duration-200 focus:outline-none focus:ring-2 focus:bg-white ${
                    errors.confirmPassword ? "border-red-400 focus:ring-red-100" : "border-[#E5E5E5] focus:border-[#C9A227] focus:ring-[#C9A227]/15"
                  }`}
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-sm text-[#6B6B6B] mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-[#C9A227] hover:underline underline-offset-2 font-medium">Sign in</Link>
          </p>
        </div>

        <div className="hidden lg:block relative m-3 rounded-2xl overflow-hidden">
         <img
  src="/auth-visual-register.jpg"
  alt="Marketplace shopping experience"
  className="absolute inset-0 w-full h-full object-cover"
/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute top-6 right-6 bg-white/95 backdrop-blur px-4 py-2.5 rounded-xl shadow-sm animate-float">
            <p className="text-xs font-medium text-[#111111]">★ 4.9 seller rating</p>
          </div>
          <div className="absolute bottom-8 left-6 right-6 bg-white/95 backdrop-blur px-4 py-3 rounded-xl shadow-sm animate-float" style={{ animationDelay: "1s" }}>
            <p className="text-xs font-medium text-[#111111] mb-1">Start selling today</p>
            <p className="text-[11px] text-[#6B6B6B]">Reach thousands of buyers instantly</p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}