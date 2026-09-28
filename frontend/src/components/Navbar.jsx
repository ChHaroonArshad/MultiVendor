import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <header className="w-full px-6 sm:px-10 py-5 flex items-center justify-between">
      <Link to="/" className="text-lg font-serif text-[#111111] tracking-tight">
        Marketplace
      </Link>
      <Link
        to="/"
        className="text-sm text-[#6B6B6B] hover:text-[#111111] transition-colors duration-200"
      >
        ← Back to home
      </Link>
    </header>
  );
}