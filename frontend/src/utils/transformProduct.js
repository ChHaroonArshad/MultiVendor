export function transformProduct(p) {
  return {
    id: p._id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice || null,
    category: p.category,
    seller: p.seller?.name || "Marketplace Seller",
    image: p.images?.[0]?.url || "",
    gallery: p.images?.map((img) => img.url) || [],
    description: p.description,
    specifications: (p.specs || []).reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {}),
    stock: p.stock,
    badge: null,     // real products don't have this yet — no fake data
    rating: null,    // reviews aren't built yet; ProductCard hides the stars when this is null
    reviews: null,
  };
}