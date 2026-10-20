const PREFIX = "marketplace:recentlyViewed";
const MAX_ITEMS = 8;

// Always the same id whichever shape the user object has. null = guest.
export function getViewerId(user) {
  const id = user?._id || user?.id;
  return id ? String(id) : null;
}

const keyFor = (userId) => `${PREFIX}:${userId || "guest"}`;

// The OLD single shared list can't be attributed to anyone, so it is removed (once per page load).
let legacyRemoved = false;
function removeLegacyList() {
  if (legacyRemoved) return;
  legacyRemoved = true;
  try {
    localStorage.removeItem(PREFIX);
  } catch {
    // storage can be blocked (private mode)
  }
}

export function getRecentlyViewed(userId) {
  removeLegacyList();
  try {
    const list = JSON.parse(localStorage.getItem(keyFor(userId)) || "[]");
    return Array.isArray(list) ? list.filter((p) => p && p.id && p.name) : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(product, userId) {
  if (!product?.id) return;
  try {
    const entry = {
      id: product.id,
      name: product.name,
      image: product.image || product.gallery?.[0] || "",
      price: product.price,
    };
    const next = [entry, ...getRecentlyViewed(userId).filter((p) => p.id !== entry.id)].slice(0, MAX_ITEMS);
    localStorage.setItem(keyFor(userId), JSON.stringify(next));
  } catch {
    // the feature just stays empty
  }
}

export function clearRecentlyViewed(userId) {
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {
    // ignore
  }
}