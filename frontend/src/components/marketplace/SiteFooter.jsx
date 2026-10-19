import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#E5E5E5] py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
        <div>
          <p className="font-serif text-lg text-[#111111] mb-3">Marketplace</p>
          <ul className="space-y-2 text-[#6B6B6B] text-xs">
            <li><Link to="/" className="hover:text-[#111111]">Home</Link></li>
            <li><Link to="/products" className="hover:text-[#111111]">Products</Link></li>
            <li><Link to="/categories" className="hover:text-[#111111]">Categories</Link></li>
            <li><Link to="/#sellers" className="hover:text-[#111111]">Sellers</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-[#111111] mb-3">For Buyers</p>
          <ul className="space-y-2 text-[#6B6B6B] text-xs">
            <li><Link to="/customer/orders" className="hover:text-[#111111]">Orders</Link></li>
            <li><Link to="/help" className="hover:text-[#111111]">Help Center</Link></li>
            <li><Link to="/help#faq" className="hover:text-[#111111]">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-[#111111] mb-3">For Sellers</p>
          <ul className="space-y-2 text-[#6B6B6B] text-xs">
            <li><Link to="/register" className="hover:text-[#111111]">Become a Seller</Link></li>
            <li><Link to="/seller" className="hover:text-[#111111]">Seller Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-[#111111] mb-3">Company</p>
          <ul className="space-y-2 text-[#6B6B6B] text-xs">
            <li><Link to="/about" className="hover:text-[#111111]">About us</Link></li>
            <li><Link to="/help#contact" className="hover:text-[#111111]">Contact</Link></li>
            <li><Link to="/help" className="hover:text-[#111111]">Help & Support</Link></li>
          </ul>
        </div>
      </div>
      <p className="text-center text-xs text-[#B0B0B0] mt-10">© {new Date().getFullYear()} Marketplace. All rights reserved.</p>
    </footer>
  );
}