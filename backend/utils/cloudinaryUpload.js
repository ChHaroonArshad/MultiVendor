import { Readable } from "node:stream";
import { cloudinary } from "../config/cloudinaryConfig.js";

export function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

export async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    // A failed cleanup shouldn't block the user's delete/update — log and move on
    console.error(`Failed to delete Cloudinary image ${publicId}:`, err.message);
  }
}