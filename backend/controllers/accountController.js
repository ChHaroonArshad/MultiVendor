import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as accountService from "../services/accountService.js";
import { clearAuthCookies } from "../utils/cookieUtils.js";

export const deleteAccount = asyncHandler(async (req, res) => {
  await accountService.deleteAccount(req.user.userId, req.body);
  clearAuthCookies(res);
  sendSuccessResponse(res, 200, "Your account has been deleted", null);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await accountService.updateProfile(req.user.userId, req.body);
  sendSuccessResponse(res, 200, "Profile updated", { user });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const user = await accountService.setAvatar(req.user.userId, req.file);
  sendSuccessResponse(res, 200, "Profile photo updated", { user });
});

export const removeAvatar = asyncHandler(async (req, res) => {
  const user = await accountService.removeAvatar(req.user.userId);
  sendSuccessResponse(res, 200, "Profile photo removed", { user });
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const user = await accountService.updatePreferences(req.user.userId, req.body);
  sendSuccessResponse(res, 200, "Preferences saved", { user });
});