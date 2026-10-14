import { categories } from "../data/marketplaceData";

export const BRAND_NAME = "Marketplace"; // change the wordmark here

const IMG = "/images/home";
const unsplash = (photoId, width = 1600) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=80`;

export const normalizeKey = (text = "") => String(text).toLowerCase().replace(/[^a-z]/g, "");

// Link to the catalogue filtered by a category. `id` is the exact value stored on products.
export const categoryPath = (name) => {
  const cat = categories.find((c) => normalizeKey(c.name) === normalizeKey(name));
  return cat ? `/products?category=${encodeURIComponent(cat.id)}` : "/products";
};

// Old or hand-typed links like ?category=electronics still resolve to the stored value "Electronics".
export const resolveCategoryId = (value = "") => {
  const key = normalizeKey(value);
  const match = categories.find((c) => normalizeKey(c.id) === key || normalizeKey(c.name) === key);
  return match ? match.id : value;
};

// A slide whose image fails to load is skipped by the slider, so these can be added or removed freely.
export const HERO_SLIDES = [
  { id: "fashion", label: "Fashion", alt: "Fashion for every day", image: `${IMG}/hero-fashion.jpg`, to: categoryPath("Fashion") },
  { id: "electronics", label: "Electronics", alt: "Headphones beside a laptop", image: unsplash("photo-1556196148-1fb724238998"), to: categoryPath("Electronics") },
  { id: "home", label: "Home & Kitchen", alt: "A styled home interior", image: `${IMG}/hero-home.jpg`, to: categoryPath("Home & Kitchen") },
  { id: "shoes", label: "Shoes & Sneakers", alt: "Sneakers", image: `${IMG}/hero-shoes.jpg`, to: categoryPath("Shoes") },
];

export const BANNER_IMAGE = `${IMG}/banner.jpg`;

// Visuals are matched by category NAME, so the existing category ids keep working.
const CATEGORY_VISUALS = {
  electronics: { icon: "smartphone", image: unsplash("photo-1546435770-a3e426bf472b", 700), tint: "bg-[#E9ECEF]" },
  fashion: { icon: "shirt", image: `${IMG}/cat-fashion.jpg`, tint: "bg-[#F2E8E4]" },
  shoes: { icon: "shoe", image: `${IMG}/cat-shoes.jpg`, tint: "bg-[#EFE9DF]" },
  beauty: { icon: "sparkles", image: `${IMG}/cat-beauty.jpg`, tint: "bg-[#F4E6E8]" },
  homekitchen: { icon: "home", image: `${IMG}/cat-home-kitchen.jpg`, tint: "bg-[#E8EDE6]" },
  accessories: { icon: "watch", image: `${IMG}/cat-accessories.jpg`, tint: "bg-[#ECE8F0]" },
  sports: { icon: "dumbbell", image: `${IMG}/cat-sports.jpg`, tint: "bg-[#E8EDE6]" },
  books: { icon: "book", image: `${IMG}/cat-books.jpg`, tint: "bg-[#F1EBDD]" },
  gaming: { icon: "gamepad", image: `${IMG}/cat-gaming.jpg`, tint: "bg-[#E9E8F1]" },
};

const DEFAULT_VISUAL = { icon: "bag", image: null, tint: "bg-[#F1EEE8]" };
export const getCategoryVisual = (name) => CATEGORY_VISUALS[normalizeKey(name)] || DEFAULT_VISUAL;

// Products that should be shown whole (not cropped) inside the card image area.
const CONTAIN_KEYS = new Set(["electronics", "shoes", "beauty", "homekitchen", "accessories", "sports", "books", "gaming"]);
export const shouldContain = (categoryLabel) => CONTAIN_KEYS.has(normalizeKey(categoryLabel));

// Accepts the stored id ("Home") or the display name ("Home & Kitchen") and returns the display name.
export const getCategoryLabel = (value) =>
  categories.find((c) => c.id === value || c.name === value)?.name || value || "";

export const WHY_ITEMS = [
  { icon: "shield", title: "Secure Payments", text: "Protected checkout and secure payment processing." },
  { icon: "shield", title: "Verified Sellers", text: "Shop from approved marketplace sellers." },
  { icon: "package", title: "Quality Products", text: "Discover products from multiple categories." },
  { icon: "truck", title: "Easy Order Tracking", text: "Track your purchases easily." },
];