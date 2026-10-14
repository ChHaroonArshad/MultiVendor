import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as storeService from "../services/storeService.js";

export const getMyStore = asyncHandler(async (req, res) => {
  const store = await storeService.getMyStore(req.user.userId);
  sendSuccessResponse(res, 200, "Store fetched", { store });
});

export const updateMyStore = asyncHandler(async (req, res) => {
  const store = await storeService.updateMyStore(req.user.userId, req.body);
  sendSuccessResponse(res, 200, "Store updated", { store });
});

export const uploadStoreImage = asyncHandler(async (req, res) => {
  const store = await storeService.setStoreImage(req.user.userId, req.params.kind, req.file);
  sendSuccessResponse(res, 200, "Store image updated", { store });
});

export const removeStoreImage = asyncHandler(async (req, res) => {
  const store = await storeService.removeStoreImage(req.user.userId, req.params.kind);
  sendSuccessResponse(res, 200, "Store image removed", { store });
});

export const listPublicStores = asyncHandler(async (req, res) => {
  const stores = await storeService.listPublicStores(req.query);
  sendSuccessResponse(res, 200, "Stores fetched", { stores });
});

export const getPublicStore = asyncHandler(async (req, res) => {
  const store = await storeService.getPublicStore(req.params.id);
  sendSuccessResponse(res, 200, "Store fetched", { store });
});