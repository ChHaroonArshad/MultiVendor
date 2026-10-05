import multer from "multer";
import { createApiError } from "../utils/apiError.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 }, // 5MB each, max 30 images
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(createApiError(400, "Only image files are allowed"));
    }
    cb(null, true);
  },
});

export function handleProductImagesUpload(req, res, next) {
  upload.array("images", 30)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return next(createApiError(400, err.message));
      }
      return next(err);
    }
    next();
  });
}