import { Link } from "react-router-dom";
import { BrandMark } from "./marketplaceUi";

function FooterColumn({ title, links }) {
  return (
    <div>
      <p className="font-medium text-[#111111] mb-4">{title}</p>
      <ul className="space-y-2.5 text-xs text-[#6B6B6B]">
        {links.map((l) => (
          <li key={l.label}>
            {l.to ? <Link to={l.to} className="hover:text-[#111111] transition-colors">{l.label}</Link> : <span className="cursor-default">{l.label}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketplaceFooter() {
  return (
    <footer className="border-t border-[#E8E5DF] py-14 bg-white">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-2 lg:grid-cols-4 gap-10 text-sm">
        <div className="col-span-2 lg:col-span-1">
          <div className="mb-4"><BrandMark /></div>
          <ul className="space-y-2.5 text-xs text-[#6B6B6B]">
            <li><Link to="/" className="hover:text-[#111111] transition-colors">Home</Link></li>
            <li><Link to="/products" className="hover:text-[#111111] transition-colors">Products</Link></li>
            <li><Link to="/categories" className="hover:text-[#111111] transition-colors">Categories</Link></li>
            <li><Link to="/#sellers" className="hover:text-[#111111] transition-colors">Sellers</Link></li>
          </ul>
        </div>
        <FooterColumn title="For Buyers" links={[{ label: "Orders", to: "/customer/orders" }, { label: "Wishlist", to: "/customer/wishlist" }, { label: "Cart", to: "/customer/basket" }, { label: "Help" }]} />
        <FooterColumn title="For Sellers" links={[{ label: "Become a Seller", to: "/register" }, { label: "Seller Dashboard", to: "/seller" }, { label: "Seller Guide" }]} />
        <FooterColumn title="Company" links={[{ label: "About" }, { label: "Contact" }, { label: "Privacy" }, { label: "Terms" }]} />
      </div>
      <p className="text-center text-xs text-[#9A968D] mt-12">© {new Date().getFullYear()} Marketplace. All rights reserved.</p>
    </footer>
  );
}