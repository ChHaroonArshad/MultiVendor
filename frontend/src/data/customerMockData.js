export const mockCustomer = { name: "Emma Carter", email: "emma@example.com", avatar: "https://i.pravatar.cc/150?img=47" };

const img = (seed) => `https://picsum.photos/seed/${seed}/400/400`;

export const mockProducts = [
  { id: "p1", name: "Wireless Headphones", seller: "AudioCraft", price: 129, oldPrice: 159, rating: 4.8, image: img("headphones1"), stock: "in-stock" },
  { id: "p2", name: "Leather Backpack", seller: "Urban Craft", price: 89, oldPrice: null, rating: 4.6, image: img("backpack1"), stock: "low-stock" },
  { id: "p3", name: "Running Shoes", seller: "FitEdge", price: 66, oldPrice: 82, rating: 4.7, image: img("shoes1"), stock: "in-stock" },
  { id: "p4", name: "Ceramic Vase Set", seller: "Casa Living", price: 42, oldPrice: 55, rating: 4.9, image: img("vase1"), stock: "in-stock" },
  { id: "p5", name: "Matte Lipstick Duo", seller: "Bloom Beauty", price: 24, oldPrice: null, rating: 4.5, image: img("lipstick1"), stock: "in-stock" },
  { id: "p6", name: "Smart Watch Series 4", seller: "TechWorld", price: 189, oldPrice: 220, rating: 4.7, image: img("watch1"), stock: "low-stock" },
];

export const mockDashboardStats = {
  totalOrders: { value: 24, note: "3 currently active" },
  wishlist: { value: 18, note: "4 price changes" },
  basket: { value: 5, note: "$284.50 estimated total" },
  reviews: { value: 14, note: "3 products awaiting review" },
};

export const mockActiveOrder = {
  id: "ORD-10294",
  itemsSummary: "Wireless Headphones + 2 more items",
  status: "shipped",
  estimatedDelivery: "June 26, 2026",
  carrier: "SwiftShip Logistics",
};

export const mockOrders = [
  { id: "ORD-10294", date: "Jun 20, 2026", items: 3, total: 284.5, status: "shipped", seller: "AudioCraft", preview: img("headphones1") },
  { id: "ORD-10201", date: "Jun 10, 2026", items: 1, total: 89, status: "delivered", seller: "Urban Craft", preview: img("backpack1") },
  { id: "ORD-10154", date: "May 29, 2026", items: 2, total: 108, status: "delivered", seller: "FitEdge", preview: img("shoes1") },
  { id: "ORD-10098", date: "May 14, 2026", items: 1, total: 24, status: "cancelled", seller: "Bloom Beauty", preview: img("lipstick1") },
  { id: "ORD-10032", date: "Apr 30, 2026", items: 2, total: 97, status: "processing", seller: "Casa Living", preview: img("vase1") },
];

export const mockOrderDetails = {
  "ORD-10294": {
    id: "ORD-10294",
    date: "Jun 20, 2026",
    paymentStatus: "Paid",
    status: "shipped",
    items: [
      { id: "p1", name: "Wireless Headphones", seller: "AudioCraft", qty: 1, price: 129, image: img("headphones1") },
      { id: "p3", name: "Running Shoes", seller: "FitEdge", qty: 1, price: 66, image: img("shoes1") },
      { id: "p5", name: "Matte Lipstick Duo", seller: "Bloom Beauty", qty: 1, price: 24, image: img("lipstick1") },
    ],
    address: { name: "Emma Carter", line: "221B Baker Street", city: "London", province: "Greater London", postal: "NW1 6XE", country: "United Kingdom", phone: "+44 20 1234 5678" },
    summary: { subtotal: 219, shipping: 9.5, discount: 10, tax: 12, total: 230.5 },
  },
};

export const mockWishlist = mockProducts.map((p, i) => ({ ...p, priceDropped: i % 3 === 0 }));

export const mockBasket = [
  { seller: "TechWorld", items: [{ id: "p6", name: "Smart Watch Series 4", price: 189, qty: 1, image: img("watch1") }] },
  { seller: "AudioCraft", items: [{ id: "p1", name: "Wireless Headphones", price: 129, qty: 1, image: img("headphones1") }] },
  { seller: "Urban Craft", items: [{ id: "p2", name: "Leather Backpack", price: 89, qty: 1, image: img("backpack1") }] },
];

export const mockReviewsPending = [
  { id: "p3", name: "Running Shoes", seller: "FitEdge", purchaseDate: "May 29, 2026", image: img("shoes1") },
];

export const mockReviewsPublished = [
  { id: "rv1", product: "Leather Backpack", rating: 5, title: "Excellent quality", text: "Beautiful craftsmanship and arrived earlier than expected.", date: "Jun 12, 2026", image: img("backpack1") },
];

export const mockAddresses = [
  { id: "a1", isDefault: true, name: "Emma Carter", phone: "+44 20 1234 5678", line: "221B Baker Street", city: "London", province: "Greater London", postal: "NW1 6XE", country: "United Kingdom" },
  { id: "a2", isDefault: false, name: "Emma Carter (Office)", phone: "+44 20 9876 5432", line: "45 King's Road", city: "London", province: "Greater London", postal: "SW3 4ND", country: "United Kingdom" },
];

export const mockNotifications = [
  { id: "n1", category: "orders", title: "Your order has shipped", body: "Order #ORD-10294 is on the way.", time: "2h ago", unread: true },
  { id: "n2", category: "promotions", title: "Price dropped", body: "Wireless Headphones are now $129.", time: "1d ago", unread: true },
  { id: "n3", category: "reviews", title: "Review reminder", body: "Tell us about your recent purchase.", time: "3d ago", unread: false },
  { id: "n4", category: "account", title: "Password changed", body: "Your password was changed successfully.", time: "1w ago", unread: false },
];

export const mockActivity = [
  { day: "Today", text: "Viewed Wireless Headphones" },
  { day: "Yesterday", text: "Added Leather Backpack to wishlist" },
  { day: "Jun 20", text: "Placed order #ORD-10294" },
  { day: "Jun 18", text: "Added Running Shoes to basket" },
];

export const mockInsights = { totalSpent: 428.5, orders: 12, productsPurchased: 18, monthly: [40, 65, 30, 90, 55, 80] };