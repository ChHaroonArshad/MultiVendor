const KEY = "marketplace:recentlyViewed";
const MAX_ITEMS = 8;

export function getRecentlyViewed() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list.filter((p) => p && p.id && p.name) : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(product) {
  if (!product?.id) return;
  try {
    const entry = {
      id: product.id,
      name: product.name,
      image: product.image || product.gallery?.[0] || "",
      price: product.price,
    };
    const next = [entry, ...getRecentlyViewed().filter((p) => p.id !== entry.id)].slice(0, MAX_ITEMS);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage can be blocked (private mode); the feature just stays empty
  }
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}