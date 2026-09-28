import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "../../components/Navbar";

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [status, setStatus] = useState(token ? "verifying" : "pending");
    const [errorMessage, setErrorMessage] = useState("");
    const [resendEmail, setResendEmail] = useState("");
    const [resendStatus, setResendStatus] = useState("idle");

    const hasVerified = useRef(false); // survives StrictMode's double-invocation

    useEffect(() => {
        if (!token) return;
        if (hasVerified.current) return; // already fired once for this token — skip
        hasVerified.current = true;

        async function verify() {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`
                );
                const data = await res.json();

                if (!res.ok) {
                    setStatus("error");
                    setErrorMessage(data.message || "Verification failed.");
                    return;
                }

                setStatus("success");
                setTimeout(() => {
                    navigate("/success?message=" + encodeURIComponent("Email verified successfully") + "&to=/login");
                }, 2000);
            } catch {
                setStatus("error");
                setErrorMessage("Unable to reach the server. Please try again.");
            }
        }

        verify();
    }, [token, navigate]);


    
    const handleResend = async (e) => {
        e.preventDefault();
        setResendStatus("sending");
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/resend-verification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resendEmail }),
            });
            await res.json();
            setResendStatus("sent"); // generic outcome either way — don't leak account existence
        } catch {
            setResendStatus("idle");
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#E5E5E5] p-10 text-center animate-fade-slide-up">

                    {status === "pending" && (
                        <>
                            <h1 className="text-xl font-serif text-[#111111] mb-2">Check your inbox</h1>
                            <p className="text-sm text-[#6B6B6B] mb-6">
                                We've sent a verification link to your email. Click it to activate your account.
                            </p>

                            {resendStatus === "sent" ? (
                                <p className="text-sm text-emerald-600 mb-4">
                                    If that account exists and isn't verified, a new link is on its way.
                                </p>
                            ) : (
                                <form onSubmit={handleResend} className="flex flex-col gap-3 mb-4">
                                    <input
                                        type="email"
                                        required
                                        placeholder="Didn't get it? Re-enter your email"
                                        value={resendEmail}
                                        onChange={(e) => setResendEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-full border border-[#E5E5E5] text-sm bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={resendStatus === "sending"}
                                        className="w-full bg-[#111111] text-white py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-50"
                                    >
                                        {resendStatus === "sending" ? "Sending..." : "Resend verification email"}
                                    </button>
                                </form>
                            )}

                            <Link to="/login" className="text-sm text-[#C9A227] hover:underline underline-offset-2">
                                Return to login
                            </Link>
                        </>
                    )}

                    {status === "verifying" && (
                        <>
                            <div className="w-10 h-10 border-2 border-[#E5E5E5] border-t-[#C9A227] rounded-full animate-spin mx-auto mb-5" />
                            <h1 className="text-xl font-serif text-[#111111] mb-2">Verifying your email...</h1>
                            <p className="text-sm text-[#6B6B6B]">This will only take a moment.</p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <h1 className="text-xl font-serif text-[#111111] mb-2">Email verified 🎉</h1>
                            <p className="text-sm text-[#6B6B6B]">Redirecting you to sign in...</p>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <h1 className="text-xl font-serif text-[#111111] mb-2">Verification failed</h1>
                            <p className="text-sm text-[#6B6B6B] mb-6">{errorMessage}</p>

                            {resendStatus === "sent" ? (
                                <p className="text-sm text-emerald-600 mb-4">
                                    If that account exists and isn't verified, a new link is on its way.
                                </p>
                            ) : (
                                <form onSubmit={handleResend} className="flex flex-col gap-3 mb-4">
                                    <input
                                        type="email"
                                        required
                                        placeholder="you@example.com"
                                        value={resendEmail}
                                        onChange={(e) => setResendEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-full border border-[#E5E5E5] text-sm bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={resendStatus === "sending"}
                                        className="w-full bg-[#111111] text-white py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-50"
                                    >
                                        {resendStatus === "sending" ? "Sending..." : "Resend verification email"}
                                    </button>
                                </form>
                            )}

                            <Link to="/login" className="text-sm text-[#C9A227] hover:underline underline-offset-2">
                                Return to login
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}