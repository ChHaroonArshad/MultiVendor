import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as adminUserService from "../services/adminUserService.js";

export const listUsers = asyncHandler(async (req, res) => {
  const result = await adminUserService.listUsers(req.query);
  sendSuccessResponse(res, 200, "Users fetched", result); // { users, pagination }
});

export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await adminUserService.getUserStats();
  sendSuccessResponse(res, 200, "Stats fetched", { stats });
});

export const getUser = asyncHandler(async (req, res) => {
  const result = await adminUserService.getUserDetail(req.params.id);
  sendSuccessResponse(res, 200, "User fetched", result); // { user, activity }
});

export const suspendUser = asyncHandler(async (req, res) => {
  const user = await adminUserService.suspendUser(req.user.userId, req.params.id, req.body.reason);
  sendSuccessResponse(res, 200, "User suspended", { user });
});

export const reactivateUser = asyncHandler(async (req, res) => {
  const user = await adminUserService.reactivateUser(req.params.id);
  sendSuccessResponse(res, 200, "User reactivated", { user });
});