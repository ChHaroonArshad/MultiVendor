import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="w-full px-6 sm:px-10 py-5 flex items-center justify-between">
        <span className="text-lg font-serif text-[#111111] tracking-tight">Marketplace</span>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-[#6B6B6B] hover:text-[#111111] transition-colors duration-200"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="text-sm bg-[#111111] text-white px-4 py-2 rounded-full transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
          >
            Create account
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-24 text-center animate-fade-slide-up">
        <p className="text-xs uppercase tracking-widest text-[#C9A227] font-medium mb-4">
          Buy and sell with confidence
        </p>
        <h1 className="text-4xl sm:text-5xl font-serif text-[#111111] mb-4">
          A marketplace built on trust
        </h1>
        <p className="text-sm text-[#6B6B6B] max-w-md mx-auto mb-10">
          Discover products from verified sellers, or open your own store and
          start selling — all in one place.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/register"
            className="bg-[#111111] text-white px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="border border-[#E5E5E5] text-[#111111] px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 hover:bg-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}