import mongoose from "mongoose";
import { WishlistItem } from "../models/WishlistItem.js";
import { Product } from "../models/Product.js";
import { createApiError } from "../utils/apiError.js";

const MAX_ITEMS = 200;
const MAX_LIMIT = 48;
const MAX_SEARCH_LENGTH = 100;
const SORTS = {
  recent: { createdAt: -1, _id: -1 },
  "price-low": { "product.price": 1, _id: 1 },
  "price-high": { "product.price": -1, _id: -1 },
  name: { "product.name": 1, _id: 1 },
};

const asString = (value) => (typeof value === "string" ? value : "");
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const countItems = (userId) => WishlistItem.countDocuments({ user: userId });

function assertValidObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw createApiError(400, "Invalid product id");
}

// Product ids only, for drawing hearts everywhere. Items whose product no longer exists are tidied away.
export async function getWishlistIds(userId) {
  const rows = await WishlistItem.find({ user: userId }).sort({ createdAt: -1 }).select("product").lean();
  const productIds = rows.map((row) => row.product);

  const existing = new Set((await Product.distinct("_id", { _id: { $in: productIds } })).map(String));
  const orphans = productIds.filter((id) => !existing.has(String(id)));
  if (orphans.length > 0) {
    WishlistItem.deleteMany({ user: userId, product: { $in: orphans } }).catch(() => {});
  }

  return productIds.map(String).filter((id) => existing.has(id));
}

export async function listWishlist({ userId, search, sort, page, limit }) {
  const sortKey = asString(sort) || "recent";
  if (!SORTS[sortKey]) throw createApiError(400, "Invalid sort option");

  const term = asString(search).trim().slice(0, MAX_SEARCH_LENGTH);
  const pageNum = Math.max(1, parseInt(asString(page), 10) || 1);
  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(asString(limit), 10) || 12));

  const [result] = await WishlistItem.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $lookup: { from: "products", localField: "product", foreignField: "_id", as: "product" } },
    { $unwind: "$product" }, // drops items whose product was deleted
    ...(term ? [{ $match: { "product.name": { $regex: escapeRegex(term), $options: "i" } } }] : []),
    { $lookup: { from: "users", localField: "product.seller", foreignField: "_id", as: "sellerUser" } },
    { $sort: SORTS[sortKey] },
    {
      $facet: {
        items: [
          { $skip: (pageNum - 1) * limitNum },
          { $limit: limitNum },
          {
            $project: {
              _id: 0,
              addedAt: "$createdAt",
              seller: { $arrayElemAt: ["$sellerUser.name", 0] },
              product: {
                _id: "$product._id",
                name: "$product.name",
                price: "$product.price",
                originalPrice: "$product.originalPrice",
                stock: "$product.stock",
                category: "$product.category",
                image: { $arrayElemAt: ["$product.images.url", 0] },
                approvalStatus: "$product.approvalStatus",
                isPublished: "$product.isPublished",
              },
            },
          },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  const total = result.total[0]?.count || 0;
  const items = result.items.map(({ addedAt, seller, product }) => ({
    id: product._id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice || null,
    category: product.category,
    image: product.image || "",
    stock: product.stock,
    seller: seller || "Marketplace Seller",
    available: product.approvalStatus === "approved" && product.isPublished,
    addedAt,
  }));

  return {
    items,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.max(1, Math.ceil(total / limitNum)) },
  };
}

export async function addItem(userId, productId) {
  assertValidObjectId(productId);

  const product = await Product.findOne({ _id: productId, approvalStatus: "approved", isPublished: true }).select("_id").lean();
  if (!product) throw createApiError(404, "Product not available");

  if (await WishlistItem.exists({ user: userId, product: productId })) {
    return { inWishlist: true, count: await countItems(userId) }; // already saved: nothing to do
  }
  if ((await countItems(userId)) >= MAX_ITEMS) {
    throw createApiError(409, `Your wishlist is full (${MAX_ITEMS} items). Remove something to add more.`);
  }

  try {
    await WishlistItem.create({ user: userId, product: productId });
  } catch (err) {
    if (err.code !== 11000) throw err; // a simultaneous request saved it first: that is fine
  }
  return { inWishlist: true, count: await countItems(userId) };
}

// Idempotent: removing something that is not there is not an error.
export async function removeItem(userId, productId) {
  assertValidObjectId(productId);
  await WishlistItem.deleteOne({ user: userId, product: productId });
  return { inWishlist: false, count: await countItems(userId) };
}

export async function clearWishlist(userId) {
  const result = await WishlistItem.deleteMany({ user: userId });
  return { deleted: result.deletedCount };
}