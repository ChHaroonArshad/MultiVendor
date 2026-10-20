import mongoose from "mongoose";
import { SellerProfile } from "../models/SellerProfile.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryUpload.js";
import { createApiError } from "../utils/apiError.js";
import { getStoreCompletion } from "../utils/storeCompletion.js";


const IMAGE_KINDS = ["logo", "banner"];
const STORE_FOLDER = "marketplace/stores";
const TRANSFORMS = {
  logo: "c_fill,g_auto,w_256,h_256,f_auto,q_auto",
  banner: "c_fill,g_auto,w_1200,h_400,f_auto,q_auto",
};
const LIVE_PRODUCT = { approvalStatus: "approved", isPublished: true };
const MAX_PUBLIC_STORES = 24;

const defaultStoreName = (name) => `${name}'s Store`.slice(0, 60);
const withTransform = (url, kind) => url.replace("/upload/", `/upload/${TRANSFORMS[kind]}/`);

function assertKind(kind) {
  if (!IMAGE_KINDS.includes(kind)) throw createApiError(400, "Image type must be logo or banner");
}

async function safeDelete(publicId) {
  if (!publicId) return;
  try {
    await deleteFromCloudinary(publicId);
  } catch (err) {
    console.error("Cloudinary cleanup failed:", err.message); // an orphaned file must never fail the request
  }
}

// ---------- the seller's own store ----------

// Creates the profile the first time it is needed. Upsert + the unique index means two
// simultaneous first requests can never create two profiles.
export async function getMyStore(sellerId) {
  const seller = await User.findOne({ _id: sellerId, role: "seller", status: "active" }).select("name").lean();
  if (!seller) throw createApiError(401, "Account not found or suspended.");

  return SellerProfile.findOneAndUpdate(
    { seller: sellerId },
    { $setOnInsert: { storeName: defaultStoreName(seller.name) } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
}

export async function updateMyStore(sellerId, data) {
  await getMyStore(sellerId); // makes sure the profile exists and the seller is active
  return SellerProfile.findOneAndUpdate(
    { seller: sellerId },
    { $set: data },
    { returnDocument: "after", runValidators: true }
  );
}

export async function setStoreImage(sellerId, kind, file) {
  assertKind(kind);
  if (!file) throw createApiError(400, "Please choose an image to upload.");

  await getMyStore(sellerId);
  const profile = await SellerProfile.findOne({ seller: sellerId }).select(`+${kind}PublicId`);
  const previousPublicId = profile[`${kind}PublicId`];

  // New image first, old image last: a failed upload never leaves the store without its picture.
  const uploaded = await uploadBufferToCloudinary(file.buffer, STORE_FOLDER);

  profile[kind] = withTransform(uploaded.secure_url, kind);
  profile[`${kind}PublicId`] = uploaded.public_id;
  try {
    await profile.save();
  } catch (err) {
    await safeDelete(uploaded.public_id);
    throw err;
  }

  await safeDelete(previousPublicId);
  return profile;
}

export async function removeStoreImage(sellerId, kind) {
  assertKind(kind);
  await getMyStore(sellerId);
  const profile = await SellerProfile.findOne({ seller: sellerId }).select(`+${kind}PublicId`);
  const previousPublicId = profile[`${kind}PublicId`];

  profile[kind] = null;
  profile[`${kind}PublicId`] = null;
  await profile.save();

  await safeDelete(previousPublicId);
  return profile;
}

// ---------- public storefront ----------

// Stores are keyed by the SELLER's user id, so a product's seller id links straight to its store.
// Sellers who never customised their store get a default name, so every seller has a store page.
export async function listPublicStores({ limit } = {}) {
  const limitNum = Math.min(
    MAX_PUBLIC_STORES,
    Math.max(1, parseInt(typeof limit === "string" ? limit : "", 10) || 8)
  );

  return User.aggregate([
    { $match: { role: "seller", status: "active" } },
    { $lookup: { from: "sellerprofiles", localField: "_id", foreignField: "seller", as: "profile" } },
    {
      $lookup: {
        from: "products",
        let: { sellerId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$seller", "$$sellerId"] }, ...LIVE_PRODUCT } },
          { $count: "count" },
        ],
        as: "productStats",
      },
    },
    {
      $addFields: {
        profile: { $arrayElemAt: ["$profile", 0] },
        productCount: { $ifNull: [{ $arrayElemAt: ["$productStats.count", 0] }, 0] },
      },
    },
    { $match: { productCount: { $gt: 0 } } }, // a store with nothing for sale is not listed
    { $sort: { productCount: -1, createdAt: -1 } },
    { $limit: limitNum },
    {
      $project: {
        productCount: 1,
        storeName: { $ifNull: ["$profile.storeName", { $concat: ["$name", "'s Store"] }] },
        description: { $ifNull: ["$profile.description", ""] },
        category: { $ifNull: ["$profile.category", ""] },
        logo: { $ifNull: ["$profile.logo", null] },
        banner: { $ifNull: ["$profile.banner", null] },
      },
    },
  ]);
}

export async function getPublicStore(sellerId) {
  if (!mongoose.Types.ObjectId.isValid(sellerId)) throw createApiError(400, "Invalid store id");

  const seller = await User.findOne({ _id: sellerId, role: "seller", status: "active" }).select("name createdAt").lean();
  if (!seller) throw createApiError(404, "Store not found");

  const [profile, productCount] = await Promise.all([
    SellerProfile.findOne({ seller: sellerId }).lean(),
    Product.countDocuments({ seller: sellerId, ...LIVE_PRODUCT }),
  ]);

  // Built field by field so internal values (Cloudinary ids, phone) can never leak.
  return {
    _id: seller._id,
    storeName: profile?.storeName || defaultStoreName(seller.name),
    description: profile?.description || "",
    category: profile?.category || "",
    contactEmail: profile?.contactEmail || "",
    logo: profile?.logo || null,
    banner: profile?.banner || null,
    productCount,
    memberSince: seller.createdAt,
  };
}






export async function getStoreStatus(sellerId) {
  const seller = await User.exists({ _id: sellerId, role: "seller", status: "active" });
  if (!seller) throw createApiError(401, "Account not found or suspended.");

  const profile = await SellerProfile.findOne({ seller: sellerId }).select("description category logo").lean();
  return getStoreCompletion(profile);
}