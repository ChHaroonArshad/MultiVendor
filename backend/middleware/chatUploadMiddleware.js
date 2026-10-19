import multer from "multer";
import { createApiError } from "../utils/apiError.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(createApiError(400, "Only JPG, PNG or WEBP images can be sent"));
    }
    cb(null, true);
  },
});

const single = upload.single("image");

// For a plain JSON request multer simply does nothing, so one endpoint serves both text and image messages.
export function handleChatImageUpload(req, res, next) {
  single(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) return next(createApiError(400, err.message));
      return next(err);
    }
    next();
  });
}