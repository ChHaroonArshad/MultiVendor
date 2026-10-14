const IMG = "/images/landing";
const year = new Date().getFullYear();

export const BRAND = { name: "Luxe", tagline: "FASHION", fullName: "Luxe Fashion" };

export const ANNOUNCEMENTS = [
  { icon: "truck", text: "Free Shipping on orders over $50" },
  { icon: "return", text: "30-Day Returns" },
  { icon: "lock", text: "Secure Payment" },
];

export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/#best-sellers", dropdown: true },
  { label: "Women", to: "/?category=Women#best-sellers" },
  { label: "Men", to: "/?category=Men#best-sellers" },
  { label: "Kids", to: "/?category=Kids#best-sellers" },
  { label: "Collections", to: "/#collections" },
  { label: "Sale", to: "/#sale" },
  { label: "About Us", to: "/#contact" },
  { label: "Contact", to: "/#contact" },
];

export const SHOP_MENU = [
  { label: "All Products", to: "/#best-sellers" },
  { label: "Women", to: "/?category=Women#best-sellers" },
  { label: "Men", to: "/?category=Men#best-sellers" },
  { label: "Kids", to: "/?category=Kids#best-sellers" },
  { label: "Shoes", to: "/?category=Shoes#best-sellers" },
  { label: "Bags", to: "/?category=Bags#best-sellers" },
];

export const HERO_SLIDES = [`${IMG}/hero-1.jpg`, `${IMG}/hero-2.jpg`, `${IMG}/hero-3.jpg`];
export const HERO_AVATARS = [1, 2, 3, 4, 5].map((n) => `${IMG}/avatar-${n}.jpg`);

const categoryLink = (name) => `/?category=${encodeURIComponent(name)}#best-sellers`;

export const CATEGORIES = [
  { name: "Women", image: `${IMG}/cat-women.jpg`, to: categoryLink("Women") },
  { name: "Men", image: `${IMG}/cat-men.jpg`, to: categoryLink("Men") },
  { name: "Kids", image: `${IMG}/cat-kids.jpg`, to: categoryLink("Kids") },
  { name: "Shoes", image: `${IMG}/cat-shoes.jpg`, to: categoryLink("Shoes") },
  { name: "Bags", image: `${IMG}/cat-bags.jpg`, to: categoryLink("Bags") },
  { name: "Watches", image: `${IMG}/cat-watches.jpg`, to: categoryLink("Watches") },
  { name: "Sunglasses", image: `${IMG}/cat-sunglasses.jpg`, to: categoryLink("Sunglasses") },
  { name: "Jewelry", image: `${IMG}/cat-jewelry.jpg`, to: categoryLink("Jewelry") },
  { name: "Accessories", image: `${IMG}/cat-accessories.jpg`, to: categoryLink("Accessories") },
  { name: "Sale", image: `${IMG}/cat-sale.jpg`, to: "/#sale" },
];

export const BANNERS = [
  {
    id: "women",
    lines: ["Summer", `Collection ${year}`],
    text: "Fresh styles for every moment.",
    cta: "Shop Women",
    to: categoryLink("Women"),
    image: `${IMG}/banner-women.jpg`,
    bg: "bg-[#F7EBDD]",
  },
  {
    id: "men",
    lines: ["Men's", "Essentials"],
    text: "Timeless looks for every man.",
    cta: "Shop Men",
    to: categoryLink("Men"),
    image: `${IMG}/banner-men.jpg`,
    bg: "bg-[#E7EDF1]",
  },
  {
    id: "sale",
    lines: ["Big Sale", "Up to 50% Off"],
    text: "Don't miss out on exclusive deals!",
    cta: "Shop Now",
    to: "/#best-sellers",
    image: `${IMG}/banner-sale.jpg`,
    bg: "bg-[#F6DDD3]",
  },
];

export const BENEFITS = [
  { icon: "truck", title: "Free Shipping", text: "On orders over $50" },
  { icon: "return", title: "30-Day Returns", text: "Hassle-free returns" },
  { icon: "lock", title: "Secure Payment", text: "100% secure checkout" },
  { icon: "headset", title: "24/7 Support", text: "We're here to help" },
];

// Sample content: there is no reviews backend yet.
export const TESTIMONIALS = [
  { name: "Jessica M.", text: "Amazing quality and fast delivery! Luxe Fashion is my go-to store now.", image: `${IMG}/avatar-1.jpg` },
  { name: "David K.", text: "Stylish collection and great customer service. Highly recommend.", image: `${IMG}/avatar-2.jpg` },
  { name: "Sophia R.", text: "Love the designs! The fabric quality is top-notch and super comfortable.", image: `${IMG}/avatar-3.jpg` },
  { name: "Amir H.", text: "Ordering was smooth and the packaging felt really premium.", image: `${IMG}/avatar-4.jpg` },
  { name: "Hina S.", text: "Great variety from different sellers, all in one place.", image: `${IMG}/avatar-5.jpg` },
];

export const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All Products", to: "/#best-sellers" },
      { label: "Women", to: categoryLink("Women") },
      { label: "Men", to: categoryLink("Men") },
      { label: "Kids", to: categoryLink("Kids") },
      { label: "Shoes", to: categoryLink("Shoes") },
      { label: "Bags", to: categoryLink("Bags") },
      { label: "Accessories", to: categoryLink("Accessories") },
      { label: "Sale", to: "/#sale" },
    ],
  },
  {
    title: "Customer Service",
    links: [
      { label: "Contact Us", to: "/#contact" },
      { label: "Shipping & Delivery" },
      { label: "Returns & Refunds" },
      { label: "FAQ" },
      { label: "Size Guide" },
      { label: "Track Order", to: "/customer/orders" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/#contact" },
      { label: "Become a Seller", to: "/register" },
      { label: "Careers" },
      { label: "Blog" },
      { label: "Sustainability" },
    ],
  },
];

export const PAYMENT_METHODS = ["Visa", "Mastercard", "PayPal", "Apple Pay", "Google Pay"];