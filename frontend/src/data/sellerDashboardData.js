const img = (seed) => `https://picsum.photos/seed/${seed}/400/400`;

export const sellerStats = [
  { label: "Total Sales", value: "$12,480", change: "+12.4%", period: "from last month", positive: true },
  { label: "Total Orders", value: "184", change: "+8.1%", period: "from last month", positive: true },
  { label: "Products", value: "42", change: "+3", period: "new this month", positive: true },
  { label: "Pending Orders", value: "12", change: "-2", period: "from yesterday", positive: false },
];

export const salesChartData = {
  "7d": [40, 55, 48, 70, 62, 90, 75],
  "30d": [30, 45, 40, 60, 55, 80, 70, 65, 90, 85, 78, 95],
  "3m": [50, 65, 60, 80, 90, 100],
  "1y": [40, 50, 65, 60, 80, 75, 90, 85, 100, 95, 110, 120],
};

export const topProducts = [
  { id: "sp1", name: "Nike Sportswear", sold: 128, revenue: 4200, image: img("shoe1"), status: "in-stock" },
  { id: "sp2", name: "Adidas Running Shoes", sold: 94, revenue: 3120, image: img("shoe2"), status: "in-stock" },
  { id: "sp3", name: "Wireless Earbuds Pro", sold: 76, revenue: 2850, image: img("earbuds1"), status: "low-stock" },
  { id: "sp4", name: "Leather Wallet", sold: 61, revenue: 1830, image: img("wallet1"), status: "in-stock" },
];

export const recentOrders = [
  { id: "ORD-8891", customer: "Sarah Mitchell", product: "Nike Sportswear", date: "Jun 24, 2026", amount: 129, payment: "Paid", status: "processing" },
  { id: "ORD-8887", customer: "James Cooper", product: "Wireless Earbuds Pro", date: "Jun 23, 2026", amount: 89, payment: "Paid", status: "shipped" },
  { id: "ORD-8880", customer: "Priya Nair", product: "Adidas Running Shoes", date: "Jun 22, 2026", amount: 95, payment: "Paid", status: "delivered" },
  { id: "ORD-8875", customer: "Tom Becker", product: "Leather Wallet", date: "Jun 20, 2026", amount: 42, payment: "Refunded", status: "cancelled" },
  { id: "ORD-8869", customer: "Elena Ruiz", product: "Nike Sportswear", date: "Jun 19, 2026", amount: 129, payment: "Paid", status: "delivered" },
];

export const lowStockAlerts = [
  { name: "Nike Air Max", left: 4, image: img("airmax1") },
  { name: "Leather Backpack", left: 7, image: img("backpack2") },
  { name: "Wireless Headphones", left: 3, image: img("headphones4") },
];

export const storePerformance = [
  { label: "Store Rating", value: "4.8" },
  { label: "Product Views", value: "12.4K" },
  { label: "Conversion Rate", value: "4.6%" },
  { label: "Customer Reviews", value: "328" },
];

export const sellerProducts = [
  { id: "sp1", name: "Nike Sportswear", category: "Fashion", price: 129, stock: 24, status: "published", sales: 128, image: img("shoe1") },
  { id: "sp2", name: "Adidas Running Shoes", category: "Sports", price: 95, stock: 18, status: "published", sales: 94, image: img("shoe2") },
  { id: "sp3", name: "Wireless Earbuds Pro", category: "Electronics", price: 89, stock: 3, status: "published", sales: 76, image: img("earbuds1") },
  { id: "sp4", name: "Leather Wallet", category: "Accessories", price: 42, stock: 30, status: "published", sales: 61, image: img("wallet1") },
  { id: "sp5", name: "Studio Desk Lamp", category: "Home", price: 55, stock: 12, status: "pending", sales: 0, image: img("lamp1") },
  { id: "sp6", name: "Canvas Tote Bag", category: "Accessories", price: 28, stock: 0, status: "out-of-stock", sales: 40, image: img("tote1") },
  { id: "sp7", name: "Ceramic Mug Set", category: "Home", price: 22, stock: 15, status: "draft", sales: 0, image: img("mug1") },
];

export const sellerOrders = [
  ...recentOrders,
  { id: "ORD-8860", customer: "Marcus Lee", product: "Adidas Running Shoes", date: "Jun 17, 2026", amount: 95, payment: "Paid", status: "pending" },
  { id: "ORD-8855", customer: "Nina Patel", product: "Leather Wallet", date: "Jun 15, 2026", amount: 42, payment: "Paid", status: "shipped" },
];

export const orderStats = { total: 184, pending: 12, processing: 8, shipped: 22, delivered: 142 };

export const storeInfo = {
  name: "Urban Craft Studio",
  description: "Handmade leather goods and everyday accessories, crafted with care in small batches.",
  category: "Accessories & Home",
  email: "hello@urbancraft.example",
  phone: "+1 (555) 234-5678",
  status: "active",
  logo: img("storelogo1"),
  banner: img("storebanner1"),
};