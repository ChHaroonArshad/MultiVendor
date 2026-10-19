import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";

const LIVE_PRODUCT = { approvalStatus: "approved", isPublished: true };

export async function getPublicStats() {
  const [products, sellerIds, deliveredOrders] = await Promise.all([
    Product.countDocuments(LIVE_PRODUCT),
    Product.distinct("seller", LIVE_PRODUCT),
    Order.countDocuments({ status: "delivered" }),
  ]);

  // Same rule as the public store list: only active sellers with something for sale count as a store.
  const stores = sellerIds.length
    ? await User.countDocuments({ _id: { $in: sellerIds }, role: "seller", status: "active" })
    : 0;

  return { products, stores, deliveredOrders };
}