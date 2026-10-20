import { SellerProfile } from "../models/SellerProfile.js";
import { createApiError } from "../utils/apiError.js";
import { getStoreCompletion } from "../utils/storeCompletion.js";

export async function requireCompleteStore(req, res, next) {
  try {
    const profile = await SellerProfile.findOne({ seller: req.user.userId }).select("description category logo").lean();
    const { complete, items } = getStoreCompletion(profile);

    if (!complete) {
      const missing = items.filter((item) => !item.done).map((item) => item.label.toLowerCase());
      return next(
        createApiError(403, "Complete your store before adding products.", [
          { field: "store_incomplete", message: `Still needed: ${missing.join(", ")}.` },
        ])
      );
    }
    next();
  } catch (err) {
    next(err);
  }
}