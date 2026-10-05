import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryUpload.js";
import { createApiError } from "../utils/apiError.js";

function assertValidObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createApiError(400, "Invalid product id");
  }
}

export async function createProduct({ sellerId, data, files }) {
  if (!files || files.length === 0) {
    throw createApiError(400, "At least one product image is required");
  }

  const uploadResults = await Promise.all(
    files.map((file) => uploadBufferToCloudinary(file.buffer, "marketplace/products"))
  );
  const images = uploadResults.map((result) => ({ url: result.secure_url, publicId: result.public_id }));

  const product = await Product.create({
    ...data,
    seller: sellerId,
    images,
    approvalStatus: "pending",
    isPublished: false,
  });

  return product;
}

export async function getMyProducts(sellerId) {
  const products = await Product.find({ seller: sellerId }).sort({ createdAt: -1 });
  return products;
}

export async function getProductById(sellerId, productId) {
  assertValidObjectId(productId);
  const product = await Product.findOne({ _id: productId, seller: sellerId });
  if (!product) throw createApiError(404, "Product not found");
  return product;
}

export async function updateProduct({ sellerId, productId, data, files }) {
  assertValidObjectId(productId);

  const product = await Product.findOne({ _id: productId, seller: sellerId });
  if (!product) throw createApiError(404, "Product not found");

  const { keepImagePublicIds, ...rest } = data;

  if (keepImagePublicIds !== undefined) {
    const keepSet = new Set(keepImagePublicIds);
    const toRemove = product.images.filter((img) => !keepSet.has(img.publicId));
    const toKeep = product.images.filter((img) => keepSet.has(img.publicId));

    await Promise.all(toRemove.map((img) => deleteFromCloudinary(img.publicId)));

    let newImages = [];
    if (files && files.length > 0) {
      const uploadResults = await Promise.all(
        files.map((file) => uploadBufferToCloudinary(file.buffer, "marketplace/products"))
      );
      newImages = uploadResults.map((result) => ({ url: result.secure_url, publicId: result.public_id }));
    }

    const finalImages = [...toKeep, ...newImages];
    if (finalImages.length === 0) {
      throw createApiError(400, "A product must have at least one image");
    }
    product.images = finalImages;
  } else if (files && files.length > 0) {
    await Promise.all(product.images.map((img) => deleteFromCloudinary(img.publicId)));
    const uploadResults = await Promise.all(
      files.map((file) => uploadBufferToCloudinary(file.buffer, "marketplace/products"))
    );
    product.images = uploadResults.map((result) => ({ url: result.secure_url, publicId: result.public_id }));
  }

  Object.assign(product, rest);

  // A rejected product that the seller edits is implicitly a resubmission —
  // send it back through review rather than leaving it stuck as "rejected"
  // with stale edits the admin never saw.
  if (product.approvalStatus === "rejected") {
    product.approvalStatus = "pending";
    product.rejectionReason = null;
    product.isPublished = false;
  }

  await product.save();
  return product;
}

export async function deleteProduct(sellerId, productId) {
  assertValidObjectId(productId);
  const product = await Product.findOneAndDelete({ _id: productId, seller: sellerId });
  if (!product) throw createApiError(404, "Product not found");

  await Promise.all(product.images.map((img) => deleteFromCloudinary(img.publicId)));

  return product;
}

export async function setPublishStatus(sellerId, productId, isPublished) {
  assertValidObjectId(productId);
  const product = await Product.findOne({ _id: productId, seller: sellerId });
  if (!product) throw createApiError(404, "Product not found");

  if (product.approvalStatus !== "approved") {
    throw createApiError(400, "Only approved products can be published or unpublished");
  }

  product.isPublished = isPublished;
  await product.save();
  return product;
}

export async function getPublicProducts({ category, search, page = 1, limit = 20 } = {}) {
  const query = { approvalStatus: "approved", isPublished: true };
  if (category) query.category = category;
  if (search) query.name = { $regex: search, $options: "i" };

  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(query).populate("seller", "name").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(query),
  ]);

  return { products, total, page, pages: Math.ceil(total / limit) || 1 };
}

export async function getPublicProductById(productId) {
  assertValidObjectId(productId);
  const product = await Product.findOne({
    _id: productId,
    approvalStatus: "approved",
    isPublished: true,
  }).populate("seller", "name");

  if (!product) throw createApiError(404, "Product not found");
  return product;
}