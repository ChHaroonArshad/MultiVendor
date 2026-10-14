import multer from "multer";
import { createApiError } from "../utils/apiError.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]; // no SVG on purpose

export function createSingleImageUpload({ field, maxMb }) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxMb * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_TYPES.includes(file.mimetype)) {
        return cb(createApiError(400, "Only JPG, PNG or WebP images are allowed"));
      }
      cb(null, true);
    },
  }).single(field);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        const message = err.code === "LIMIT_FILE_SIZE" ? `Image must be under ${maxMb}MB` : err.message;
        return next(createApiError(400, message));
      }
      next(err);
    });
  };
}