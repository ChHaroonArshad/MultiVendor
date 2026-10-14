// import multer from "multer";
// import { createApiError } from "../utils/apiError.js";

// const MAX_AVATAR_MB = 2;
// const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]; // no SVG on purpose

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: MAX_AVATAR_MB * 1024 * 1024, files: 1 },
//   fileFilter: (req, file, cb) => {
//     if (!ALLOWED_TYPES.includes(file.mimetype)) {
//       return cb(createApiError(400, "Only JPG, PNG or WebP images are allowed"));
//     }
//     cb(null, true);
//   },
// });

// export function handleAvatarUpload(req, res, next) {
//   upload.single("avatar")(req, res, (err) => {
//     if (!err) return next();
//     if (err instanceof multer.MulterError) {
//       const message = err.code === "LIMIT_FILE_SIZE" ? `Image must be under ${MAX_AVATAR_MB}MB` : err.message;
//       return next(createApiError(400, message));
//     }
//     next(err);
//   });
// }

import { createSingleImageUpload } from "./singleImageUpload.js";

export const handleAvatarUpload = createSingleImageUpload({ field: "avatar", maxMb: 2 });