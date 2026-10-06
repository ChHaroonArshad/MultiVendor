export function transformCartItem(item) {
  const product = item.product;
  if (!product) return null; // defensive — backend already filters these out, but don't crash if one slips through

  return {
    id: product._id,
    name: product.name,
    price: product.price,
    image: product.images?.[0]?.url || "",
    seller: product.seller?.name || "",
    stock: product.stock,
    qty: item.quantity,
  };
}

export function transformCart(cart) {
  if (!cart?.items) return [];
  return cart.items.map(transformCartItem).filter(Boolean);
}