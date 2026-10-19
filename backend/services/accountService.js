import { User } from "../models/User.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryUpload.js";
import { createApiError } from "../utils/apiError.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Cart } from "../models/Cart.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { SellerProfile } from "../models/SellerProfile.js";
import { comparePassword } from "../utils/passwordUtils.js";
import { Notification } from "../models/Notification.js";


const AVATAR_FOLDER = "marketplace/avatars";

// The owner AND the "must be active" rule live in the query itself. Wrong id or suspended = no match.
const activeUser = (userId) => ({ _id: userId, status: "active" });

function assertFound(user) {
  // 401 (not 403) so the frontend's refresh logic signs a suspended/deleted user out
  if (!user) throw createApiError(401, "Account not found or suspended.");
  return user;
}

// Cloudinary serves a small square version instead of the original upload.
const toAvatarUrl = (url) => url.replace("/upload/", "/upload/c_fill,g_auto,w_256,h_256,f_auto,q_auto/");

async function safeDelete(publicId) {
  if (!publicId) return;
  try {
    await deleteFromCloudinary(publicId);
  } catch (err) {
    console.error("Cloudinary cleanup failed:", err.message); // an orphaned file must never fail the request
  }
}

export async function updateProfile(userId, data) {
  const user = await User.findOneAndUpdate(
    activeUser(userId),
    { $set: data },
    { returnDocument: "after", runValidators: true }
  );
  return assertFound(user);
}

export async function setAvatar(userId, file) {
  if (!file) throw createApiError(400, "Please choose an image to upload.");

  const user = assertFound(await User.findOne(activeUser(userId)).select("+avatarPublicId"));
  const previousPublicId = user.avatarPublicId;

  // New image first, old image last: a failed upload never leaves the user without a photo.
  const uploaded = await uploadBufferToCloudinary(file.buffer, AVATAR_FOLDER);

  user.avatar = toAvatarUrl(uploaded.secure_url);
  user.avatarPublicId = uploaded.public_id;
  try {
    await user.save();
  } catch (err) {
    await safeDelete(uploaded.public_id); // don't orphan the new upload
    throw err;
  }

  await safeDelete(previousPublicId);
  return user;
}

export async function removeAvatar(userId) {
  const user = assertFound(await User.findOne(activeUser(userId)).select("+avatarPublicId"));
  const previousPublicId = user.avatarPublicId;

  user.avatar = null;
  user.avatarPublicId = null;
  await user.save();

  await safeDelete(previousPublicId);
  return user;
}

export async function updatePreferences(userId, preferences) {
  // Dotted keys: changing one switch never wipes the others.
  const set = Object.fromEntries(Object.entries(preferences).map(([key, value]) => [`preferences.${key}`, value]));
  const user = await User.findOneAndUpdate(
    activeUser(userId),
    { $set: set },
    { returnDocument: "after", runValidators: true }
  );
  return assertFound(user);
}






const IN_PROGRESS_STATUSES = ["pending", "processing", "shipped"];

export async function deleteAccount(userId, { password } = {}) {
  const user = assertFound(await User.findOne(activeUser(userId)).select("+password +avatarPublicId"));

  if (user.role === "admin") throw createApiError(403, "Admin accounts cannot be deleted from here.");

  // Password accounts must prove it is really them. Google-only accounts have no password,
  // so for them the typed "DELETE" confirmation (already validated by Zod) is the check.
  if (user.password) {
    if (!password) throw createApiError(400, "Please enter your password to confirm.");
    // 400, not 401: a wrong password is a bad input, not an expired session
    if (!(await comparePassword(password, user.password))) throw createApiError(400, "Password is incorrect.");
  }

  // Money must never be stranded: refuse while any order that involves this user is still open.
  const ownerField = user.role === "seller" ? "seller" : "buyer";
  if (await Order.exists({ [ownerField]: user._id, status: { $in: IN_PROGRESS_STATUSES } })) {
    throw createApiError(
      409,
      user.role === "seller"
        ? "You still have customer orders in progress. Ship or cancel them first, then you can delete your account."
        : "You still have orders in progress. You can delete your account once they are delivered or cancelled."
    );
  }

  if (user.role === "seller") {
    const products = await Product.find({ seller: user._id }).select("images");
    await Promise.all(products.flatMap((product) => product.images.map((image) => safeDelete(image.publicId))));
    await Product.deleteMany({ seller: user._id }); // carts that held them drop them automatically on next read

    const store = await SellerProfile.findOne({ seller: user._id }).select("+logoPublicId +bannerPublicId");
    if (store) {
      await Promise.all([safeDelete(store.logoPublicId), safeDelete(store.bannerPublicId)]);
      await store.deleteOne();
    }
  }
await Promise.all([
  Cart.deleteMany({ user: user._id }),
  RefreshToken.deleteMany({ user: user._id }),
  Notification.deleteMany({ user: user._id }),
]);
  await safeDelete(user.avatarPublicId);

  // Past orders are kept for both parties' records. They reference this id, and every
  // screen already shows a missing user as "Deleted user".
  await User.deleteOne({ _id: user._id });
}