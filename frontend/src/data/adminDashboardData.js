const img = (seed, size = 200) => `https://picsum.photos/seed/${seed}/${size}/${size}`;

export const adminStats = [
  { label: "Total Users", value: "12,480", change: "+8.2%", trend: "up" },
  { label: "Total Sellers", value: "642", change: "+3.1%", trend: "up" },
  { label: "Total Orders", value: "9,214", change: "+11.4%", trend: "up" },
  { label: "Revenue", value: "$184,320", change: "-2.3%", trend: "down" },
];

export const revenueTrend = [
  { label: "Mon", value: 12 },
  { label: "Tue", value: 18 },
  { label: "Wed", value: 15 },
  { label: "Thu", value: 24 },
  { label: "Fri", value: 20 },
  { label: "Sat", value: 28 },
  { label: "Sun", value: 26 },
];

export const recentOrders = [
  { id: "ORD-7741", customer: "Ayesha Khan", seller: "TechHub", amount: 189, status: "paid", date: "24 Jan" },
  { id: "ORD-7740", customer: "Bilal Ahmed", seller: "Urban Threads", amount: 74, status: "pending", date: "24 Jan" },
  { id: "ORD-7739", customer: "Sana Malik", seller: "Modern Living", amount: 46, status: "paid", date: "23 Jan" },
  { id: "ORD-7738", customer: "Hamza Tariq", seller: "StepStyle", amount: 58, status: "shipped", date: "23 Jan" },
  { id: "ORD-7737", customer: "Zara Sheikh", seller: "Casa Living", amount: 42, status: "paid", date: "22 Jan" },
];

export const pendingApprovals = {
  sellers: [
    { id: "sel-101", name: "Craftline Studio", appliedOn: "26 Jan" },
    { id: "sel-102", name: "Northline Goods", appliedOn: "25 Jan" },
  ],
  products: [
    { id: "prd-501", name: "Handwoven Rug", seller: "Craftline Studio", submittedOn: "26 Jan" },
    { id: "prd-502", name: "Ceramic Mug Set", seller: "Casa Living", submittedOn: "25 Jan" },
    { id: "prd-503", name: "Leather Wallet", seller: "Urban Craft", submittedOn: "24 Jan" },
  ],
};

export const topSellers = [
  { id: "s2", name: "TechHub", revenue: "$24,180", image: img("store2", 80) },
  { id: "s1", name: "Urban Threads", revenue: "$18,940", image: img("store1", 80) },
  { id: "s3", name: "Modern Living", revenue: "$15,760", image: img("store3", 80) },
];

// ---- Users page ----
export const adminUsers = [
  { id: "u1", name: "Ayesha Khan", email: "ayesha@example.com", role: "customer", status: "active", joined: "12 Nov 2025" },
  { id: "u2", name: "Bilal Ahmed", email: "bilal@example.com", role: "customer", status: "active", joined: "03 Dec 2025" },
  { id: "u3", name: "Hamza Tariq", email: "hamza@techhub.com", role: "seller", status: "active", joined: "18 Sep 2025" },
  { id: "u4", name: "Sana Malik", email: "sana@example.com", role: "customer", status: "suspended", joined: "27 Aug 2025" },
  { id: "u5", name: "Zara Sheikh", email: "zara@casaliving.com", role: "seller", status: "active", joined: "05 Oct 2025" },
  { id: "u6", name: "Usman Raza", email: "usman@example.com", role: "customer", status: "active", joined: "22 Jan 2026" },
  { id: "u7", name: "Admin User", email: "admin@marketplace.com", role: "admin", status: "active", joined: "01 Jan 2025" },
  { id: "u8", name: "Fatima Noor", email: "fatima@urbanthreads.com", role: "seller", status: "suspended", joined: "14 Jul 2025" },
];

// ---- Sellers page ----
export const adminSellers = [
  { id: "sel-101", name: "Craftline Studio", email: "hello@craftline.com", category: "Home & Living", products: 0, status: "pending", appliedOn: "26 Jan 2026" },
  { id: "sel-102", name: "Northline Goods", email: "hi@northline.com", category: "Fashion", products: 0, status: "pending", appliedOn: "25 Jan 2026" },
  { id: "s1", name: "Urban Threads", email: "fatima@urbanthreads.com", category: "Fashion", products: 214, status: "approved", appliedOn: "14 Jul 2025" },
  { id: "s2", name: "TechHub", email: "hamza@techhub.com", category: "Electronics", products: 312, status: "approved", appliedOn: "18 Sep 2025" },
  { id: "s3", name: "Modern Living", email: "contact@modernliving.com", category: "Home & Living", products: 156, status: "approved", appliedOn: "02 Aug 2025" },
  { id: "s4", name: "StepStyle", email: "info@stepstyle.com", category: "Shoes", products: 98, status: "approved", appliedOn: "10 Sep 2025" },
  { id: "sel-103", name: "Bloomline Co", email: "hey@bloomline.com", category: "Beauty", products: 0, status: "rejected", appliedOn: "18 Jan 2026" },
  { id: "s5", name: "Casa Living", email: "zara@casaliving.com", category: "Home & Living", products: 87, status: "suspended", appliedOn: "05 Oct 2025" },
];

// ---- Products page ----
export const adminProducts = [
  { id: "prd-501", name: "Handwoven Rug", seller: "Craftline Studio", category: "Home & Living", price: 145, status: "pending", submittedOn: "26 Jan 2026" },
  { id: "prd-502", name: "Ceramic Mug Set", seller: "Casa Living", category: "Home & Living", price: 32, status: "pending", submittedOn: "25 Jan 2026" },
  { id: "prd-503", name: "Leather Wallet", seller: "Urban Craft", category: "Accessories", price: 39, status: "pending", submittedOn: "24 Jan 2026" },
  { id: "1", name: "Wireless Headphones", seller: "AudioCraft", category: "Electronics", price: 120, status: "published", submittedOn: "10 Dec 2025" },
  { id: "2", name: "Linen Summer Dress", seller: "Wildflower Studio", category: "Fashion", price: 68, status: "published", submittedOn: "02 Jan 2026" },
  { id: "3", name: "Ceramic Vase Set", seller: "Casa Living", category: "Home & Living", price: 42, status: "published", submittedOn: "15 Nov 2025" },
  { id: "5", name: "Running Sneakers", seller: "StepStyle", category: "Shoes", price: 89, status: "draft", submittedOn: "20 Jan 2026" },
  { id: "prd-504", name: "Knock-off Sunglasses", seller: "Northline Goods", category: "Accessories", price: 15, status: "rejected", submittedOn: "19 Jan 2026" },
];

// ---- Orders page ----
export const adminOrdersList = [
  { id: "ORD-7741", customer: "Ayesha Khan", seller: "TechHub", items: 2, amount: 189, status: "paid", date: "24 Jan 2026" },
  { id: "ORD-7740", customer: "Bilal Ahmed", seller: "Urban Threads", items: 1, amount: 74, status: "pending", date: "24 Jan 2026" },
  { id: "ORD-7739", customer: "Sana Malik", seller: "Modern Living", items: 3, amount: 46, status: "paid", date: "23 Jan 2026" },
  { id: "ORD-7738", customer: "Hamza Tariq", seller: "StepStyle", items: 1, amount: 58, status: "shipped", date: "23 Jan 2026" },
  { id: "ORD-7737", customer: "Zara Sheikh", seller: "Casa Living", items: 2, amount: 42, status: "paid", date: "22 Jan 2026" },
  { id: "ORD-7736", customer: "Usman Raza", seller: "AudioCraft", items: 1, amount: 120, status: "delivered", date: "20 Jan 2026" },
  { id: "ORD-7735", customer: "Fatima Noor", seller: "Wildflower Studio", items: 1, amount: 68, status: "cancelled", date: "19 Jan 2026" },
  { id: "ORD-7734", customer: "Ayesha Khan", seller: "TechHub", items: 1, amount: 189, status: "delivered", date: "15 Jan 2026" },
];

// ---- Categories page ----
export const adminCategories = [
  { id: "electronics", name: "Electronics", products: 1240, image: img("cat-electronics", 100) },
  { id: "fashion", name: "Fashion", products: 2410, image: img("cat-fashion", 100) },
  { id: "shoes", name: "Shoes", products: 860, image: img("cat-shoes", 100) },
  { id: "beauty", name: "Beauty", products: 1520, image: img("cat-beauty", 100) },
  { id: "home", name: "Home & Kitchen", products: 980, image: img("cat-home", 100) },
  { id: "accessories", name: "Accessories", products: 1110, image: img("cat-accessories", 100) },
];