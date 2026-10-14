import { createSingleImageUpload } from "./singleImageUpload.js";

export const handleStoreImageUpload = createSingleImageUpload({ field: "image", maxMb: 3 });