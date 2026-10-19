import { FlagIcon } from "../components/icons/FlagIcon";

export const adminNavItems = [
  { key: "overview", label: "Overview", path: "/admin" },
  { key: "users", label: "Users", path: "/admin/users" },
  { key: "sellers", label: "Sellers", path: "/admin/sellers" },
  { key: "products", label: "Products", path: "/admin/products" },
  { key: "orders", label: "Orders", path: "/admin/orders" },
  { key: "categories", label: "Categories", path: "/admin/categories" },
  { key: "settings", label: "Settings", path: "/admin/settings" },
  { key: "messages", label: "Messages", path: "/admin/messages" },
  {
    key: "reports",
    label: "Reports",
    path: "/admin/reports",
    icon: FlagIcon,
  },
];