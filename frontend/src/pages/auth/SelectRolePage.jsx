import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../../components/Navbar";
import { useAuth } from "../../hooks/useAuth";
import { getPendingGoogleSignup, completeGoogleSignup } from "../../services/authApi";
import { getHomeForRole } from "../../utils/roleUtils";

const iconProps = {
  width: 22, height: 22, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round",
};

const ROLES = [
  {
    value: "customer",
    title: "Customer",
    tagline: "Discover and buy from trusted sellers.",
    features: [
      "Browse and search the whole marketplace",
      "Save favourites to your wishlist",
      "Track every order in one place",
    ],
    icon: (
      <svg {...iconProps}>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    value: "seller",
    title: "Seller",
    tagline: "Open your store and reach more buyers.",
    features: [
      "List and manage your products",
      "Keep inventory and orders organised",
      "Follow your sales and earnings",
    ],
    icon: (
      <svg {...iconProps}>
        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
];

export function SelectRolePage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [status, setStatus] = useState("loading"); // loading | ready | expired
  const [pending, setPending] = useState(null);
  const [role, setRole] = useState("customer"); // least-privilege default
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // GET is read-only, so StrictMode's double run is harmless; `cancelled` ignores the discarded one
  useEffect(() => {
    let cancelled = false;
    getPendingGoogleSignup()
      .then((p) => {
        if (cancelled) return;
        setPending(p);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("expired");
      });
    return () => { cancelled = true; };
  }, []);

  const displayName = pending?.name?.trim() || pending?.email?.split("@")[0] || "there";
  const firstName = displayName.split(" ")[0];

  const handleContinue = async () => {
    setError("");
    setSubmitting(true);
    try {
      const user = await completeGoogleSignup(role);
      signIn(user);
      const destination = getHomeForRole(user.role);
      navigate(
        "/success?message=" + encodeURIComponent("Account created successfully") +
          "&to=" + encodeURIComponent(destination),
        { replace: true }
      );
    } catch (err) {
      // err.status exists only when the server answered; otherwise it was a network failure
      setError(err.status ? err.message : "Unable to reach the server. Please try again.");
      setSubmitting(false);
    }
  };

  const stagger = (ms) => ({ animationDelay: `${ms}ms`, animationFillMode: "both" });

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        {/* soft decorative glows */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#C9A227]/10 blur-3xl animate-float" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#C9A227]/10 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />

        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-sm border border-[#E5E5E5] px-6 py-10 sm:px-12 sm:py-12 animate-fade-slide-up">
          {status === "loading" && (
            <div className="py-16 flex flex-col items-center text-center">
              <div className="w-9 h-9 border-2 border-[#E5E5E5] border-t-[#C9A227] rounded-full animate-spin mb-4" />
              <p className="text-sm text-[#6B6B6B]">Preparing your account...</p>
            </div>
          )}

          {status === "expired" && (
            <div className="py-10 flex flex-col items-center text-center">
              <h1 className="text-3xl font-serif text-[#111111] mb-2">Sign-up session expired</h1>
              <p className="text-sm text-[#6B6B6B] mb-6 max-w-sm">
                For your security, this step is only available for a few minutes after signing in with Google.
                Please start again.
              </p>
              <Link
                to="/login"
                className="bg-[#111111] text-white px-8 py-3 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
              >
                Back to sign in
              </Link>
            </div>
          )}

          {status === "ready" && (
            <>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs border border-[#C9A227]/40 bg-[#FBF6E9] text-[#8a6f14] rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
                One last step
              </span>

              <h1 className="text-3xl sm:text-4xl font-serif text-[#111111] mb-2">
                Welcome, {firstName}. How will you use the marketplace?
              </h1>
              <p className="text-sm text-[#6B6B6B] mb-6 max-w-xl">
                Choose the account type that fits you best. Your Google account stays connected,
                so next time you can sign in with one click.
              </p>

              {/* identity strip */}
              <div
                className="flex items-center gap-3 border border-[#E5E5E5] rounded-2xl px-4 py-3 mb-7 bg-[#FAFAFA] animate-fade-slide-up"
                style={stagger(80)}
              >
                <div className="w-11 h-11 shrink-0 rounded-full bg-[#111111] text-white flex items-center justify-center font-serif text-lg">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#111111] truncate">{displayName}</p>
                  <p className="text-xs text-[#6B6B6B] truncate">{pending.email}</p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                  ✓ Verified by Google
                </span>
              </div>

              {error && (
                <div role="alert" className="mb-5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm animate-fade-slide-up">
                  {error}{" "}
                  {/expired|already exists/i.test(error) && (
                    <Link to="/login" className="underline font-medium">Back to sign in</Link>
                  )}
                </div>
              )}

              <fieldset>
                <legend className="sr-only">Choose your account type</legend>
                <div className="grid sm:grid-cols-2 gap-4">
                  {ROLES.map((r, i) => {
                    const selected = role === r.value;
                    return (
                      <label
                        key={r.value}
                        className="block cursor-pointer animate-fade-slide-up"
                        style={stagger(180 + i * 100)}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r.value}
                          checked={selected}
                          onChange={() => setRole(r.value)}
                          className="peer sr-only"
                        />
                        <div
                          className={`relative h-full rounded-2xl border p-5 transition-all duration-300 motion-reduce:transition-none peer-focus-visible:ring-2 peer-focus-visible:ring-[#C9A227]/50 ${
                            selected
                              ? "border-[#C9A227] bg-[#FBF6E9] shadow-md -translate-y-0.5"
                              : "border-[#E5E5E5] bg-white hover:border-[#C9A227]/50 hover:-translate-y-0.5"
                          }`}
                        >
                          {/* selection badge scales in */}
                          <span
                            className={`absolute top-4 right-4 w-6 h-6 rounded-full bg-[#C9A227] text-white flex items-center justify-center transition-all duration-300 ${
                              selected ? "scale-100 opacity-100" : "scale-50 opacity-0"
                            }`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>

                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300 ${
                              selected ? "bg-[#111111] text-white" : "bg-[#F3F3F3] text-[#111111]"
                            }`}
                          >
                            {r.icon}
                          </div>

                          <p className="text-lg font-serif text-[#111111]">{r.title}</p>
                          <p className="text-xs text-[#6B6B6B] mt-0.5">{r.tagline}</p>

                          <ul className="mt-4 space-y-2">
                            {r.features.map((f) => (
                              <li key={f} className="flex items-start gap-2 text-xs text-[#6B6B6B]">
                                <span className="text-[#C9A227] leading-4">✓</span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div
                className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 animate-fade-slide-up"
                style={stagger(420)}
              >
                {/* <Link to="/login" className="text-sm text-center text-[#6B6B6B] hover:text-[#111111] transition-colors">
                  Use a different account
                </Link> */}
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 bg-[#111111] text-white px-8 py-3 rounded-full text-sm font-medium sm:min-w-[230px] transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {submitting && (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {submitting ? "Creating your account..." : `Continue as ${role === "seller" ? "Seller" : "Customer"}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}