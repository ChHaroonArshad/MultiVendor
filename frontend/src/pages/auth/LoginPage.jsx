import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "../../components/Navbar";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { getHomeForRole, getSafeRedirect } from "../../utils/roleUtils";
import { startGoogleLogin } from "../../services/authApi";




const GOOGLE_ERRORS = {
    google_cancelled: "Google sign-in was cancelled.",
    google_failed: "We couldn't sign you in with Google. Please try again.",
    google_forbidden: "This account can't sign in right now. Please contact support.",
};
const loginSchema = z.object({
    email: z.string().min(1, "Email address is required.").email("Please enter a valid email address."),
    password: z.string().min(1, "Password is required."),
});

export function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [searchParams] = useSearchParams();
    const [serverError, setServerError] = useState(GOOGLE_ERRORS[searchParams.get("error")] || "");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) });

    const onSubmit = async (formData) => {
        setServerError("");
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // required so the refreshToken cookie gets set
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) {
                setServerError(data.message || "We couldn't sign you in. Please check your credentials.");
                return;
            }

            const { user } = data.data;

            // No signIn() here: /login is guest-only, so setting the user now would bounce them
            // away before the success page. The success page syncs auth state from the server instead.
            const destination = getSafeRedirect(location.state?.from, getHomeForRole(user.role));
            navigate(
                "/success?message=" + encodeURIComponent("Signed in successfully") + "&to=" + encodeURIComponent(destination),
                { replace: true }
            );
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
                    {/* LEFT: form */}
                    <div className="px-8 py-10 sm:px-14 sm:py-14 flex flex-col justify-center">
                        <span className="inline-block w-fit px-3 py-1 text-xs border border-[#E5E5E5] rounded-full text-[#6B6B6B] mb-8">
                            Marketplace
                        </span>

                        <h1 className="text-3xl sm:text-4xl font-serif text-[#111111] mb-2">Welcome back</h1>
                        <p className="text-sm text-[#6B6B6B] mb-8">
                            Sign in to continue shopping and manage your account.
                        </p>

                        {serverError && (
                            <div className="mb-5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm animate-fade-slide-up">
                                {serverError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-sm">
                            <div className="mb-4">
                                <label htmlFor="email" className="block text-xs font-medium text-[#6B6B6B] mb-1.5 ml-1">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    {...register("email")}
                                    placeholder="you@example.com"
                                    className={`w-full px-4 py-3 rounded-full border text-sm text-[#111111] bg-[#FAFAFA] placeholder:text-[#B0B0B0] transition-all duration-200 focus:outline-none focus:ring-2 focus:bg-white ${errors.email ? "border-red-400 focus:ring-red-100" : "border-[#E5E5E5] focus:border-[#C9A227] focus:ring-[#C9A227]/15"
                                        }`}
                                />
                                {errors.email && <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.email.message}</p>}
                            </div>

                            <div className="mb-5">
                                <label htmlFor="password" className="block text-xs font-medium text-[#6B6B6B] mb-1.5 ml-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        {...register("password")}
                                        placeholder="Enter your password"
                                        className={`w-full px-4 py-3 pr-12 rounded-full border text-sm text-[#111111] bg-[#FAFAFA] placeholder:text-[#B0B0B0] transition-all duration-200 focus:outline-none focus:ring-2 focus:bg-white ${errors.password ? "border-red-400 focus:ring-red-100" : "border-[#E5E5E5] focus:border-[#C9A227] focus:ring-[#C9A227]/15"
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#111111] transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.password.message}</p>}
                            </div>

                            <div className="flex items-center justify-between mb-6 text-sm px-1">
                                <label className="flex items-center gap-2 text-[#6B6B6B] cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 accent-[#C9A227] rounded" />
                                    Remember me
                                </label>
                                <Link to="/forgot-password" className="text-[#C9A227] hover:underline underline-offset-2">
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#111111] text-white py-3 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                {loading ? "Signing in..." : "Sign In"}
                            </button>
                        </form>

                        <div className="flex items-center gap-3 my-6 max-w-sm">
                            <div className="flex-1 h-px bg-[#E5E5E5]" />
                            <span className="text-[11px] tracking-widest text-[#6B6B6B]">OR</span>
                            <div className="flex-1 h-px bg-[#E5E5E5]" />
                        </div>

                        <button
                            onClick={startGoogleLogin}
                            type="button"
                            className="max-w-sm cursor-pointer flex items-center justify-center gap-2.5 border border-[#E5E5E5] bg-white text-[#111111] py-3 rounded-full text-sm font-medium transition-all duration-200 hover:bg-[#FAFAFA] hover:-translate-y-0.5"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.48a5.55 5.55 0 0 1-2.4 3.64v3h3.88c2.27-2.09 3.56-5.17 3.56-8.82z" />
                                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24z" />
                                <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38z" />
                                <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l4 3.1C6.22 6.88 8.87 4.77 12 4.77z" />
                            </svg>
                            Continue with Google
                        </button>

                        <p className="text-sm text-[#6B6B6B] mt-8">
                            Don't have an account?{" "}
                            <Link to="/register" className="text-[#C9A227] hover:underline underline-offset-2 font-medium">
                                Create one
                            </Link>
                        </p>
                    </div>

                    {/* RIGHT: visual */}
                    <div className="hidden lg:block relative m-3 rounded-2xl overflow-hidden group">
                        <img
                            src="/auth-visual-login.jpg"
                            alt="Marketplace shopping experience"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                        <div className="absolute top-6 left-6 bg-white/95 backdrop-blur px-4 py-2.5 rounded-xl shadow-sm animate-float">
                            <p className="text-xs font-medium text-[#111111]">Order shipped</p>
                            <p className="text-[11px] text-[#6B6B6B]">Arriving in 2 days</p>
                        </div>

                        <div className="absolute bottom-8 left-6 right-6 bg-white/95 backdrop-blur px-4 py-3 rounded-xl shadow-sm animate-float" style={{ animationDelay: "1s" }}>
                            <p className="text-xs font-medium text-[#111111] mb-1">Verified marketplace</p>
                            <p className="text-[11px] text-[#6B6B6B]">10,000+ trusted sellers · Secure checkout</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}