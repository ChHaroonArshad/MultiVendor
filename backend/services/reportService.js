import mongoose from "mongoose";
import { Report } from "../models/Report.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { SellerProfile } from "../models/SellerProfile.js";
import { createApiError } from "../utils/apiError.js";
import { notifyAdminsNewReport, notifyReporterReportResolved } from "./notificationService.js";

const MAX_REPORTS_PER_DAY = 20;
const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;
const MAX_MATCHED_USERS = 200;
const LIST_STATUSES = ["active", "open", "reviewing", "resolved", "dismissed", "all"];
const LIST_TYPES = ["all", "product", "store", "support"];

const asString = (value) => (typeof value === "string" ? value : "");
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const clip = (text, max) => String(text ?? "").slice(0, max);

function assertValidObjectId(id, message) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw createApiError(400, message);
}

// ---------- members and guests ----------

// Works out WHAT is being reported and WHO owns it, from our own database.
// The client only ever sends an id; names and owners are never taken from the request.
async function resolveTarget(targetType, targetId) {
  if (targetType === "product") {
    assertValidObjectId(targetId, "Invalid product id");
    const product = await Product.findOne({ _id: targetId, approvalStatus: "approved", isPublished: true })
      .select("name seller")
      .lean();
    if (!product) throw createApiError(404, "Product not found");
    return { targetProduct: product._id, targetSeller: product.seller, targetLabel: clip(product.name, 120) };
  }

  assertValidObjectId(targetId, "Invalid store id");
  const seller = await User.findOne({ _id: targetId, role: "seller", status: "active" }).select("name").lean();
  if (!seller) throw createApiError(404, "Store not found");
  const profile = await SellerProfile.findOne({ seller: seller._id }).select("storeName").lean();
  return { targetSeller: seller._id, targetLabel: clip(profile?.storeName || `${seller.name}'s Store`, 120) };
}

export async function createReport({ reporterId, targetType, targetId, reason, details }) {
  const reporter = await User.findOne({ _id: reporterId, status: "active", role: { $in: ["customer", "seller"] } })
    .select("_id")
    .lean();
  if (!reporter) throw createApiError(401, "Account not found or suspended.");

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if ((await Report.countDocuments({ reporter: reporterId, createdAt: { $gte: since } })) >= MAX_REPORTS_PER_DAY) {
    throw createApiError(429, "You have reached today's report limit. Please try again tomorrow.");
  }

  const target = await resolveTarget(targetType, targetId);
  if (String(target.targetSeller) === String(reporterId)) {
    throw createApiError(400, "You cannot report your own product or store.");
  }

  const subjectId = targetType === "product" ? target.targetProduct : target.targetSeller;

  try {
    const report = await Report.create({
      reporter: reporterId,
      targetType,
      ...target,
      reason,
      details,
      activeKey: `${reporterId}:${targetType}:${subjectId}`,
    });
    notifyAdminsNewReport(report); // not awaited: a notification failure must never fail the report
    return { id: report._id };
  } catch (err) {
    if (err.code === 11000) throw createApiError(409, "You already have an open report for this. Our team is reviewing it.");
    throw err;
  }
}

export async function createSupportRequest({ viewerId, category, message, name, email }) {
  let reporter = null;
  let contact = null;

  if (viewerId) {
    const user = await User.findOne({ _id: viewerId, status: "active" }).select("name email").lean();
    if (user) {
      reporter = user._id;
      contact = { name: user.name, email: user.email }; // taken from the account, never from the body
    }
  }

  // A guest, or a suspended user whose token is still valid (they must still be able to reach us).
  if (!reporter) {
    if (!name || !email) throw createApiError(400, "Please provide your name and email so we can reply.");
    contact = { name, email };
  }

  const report = await Report.create({
    reporter,
    contact,
    targetType: "support",
    targetLabel: "Support request",
    reason: category,
    details: message,
  });
  notifyAdminsNewReport(report);
  return { id: report._id };
}

// ---------- admin ----------

async function findUserIdsByName(pattern) {
  const users = await User.find({ name: { $regex: pattern, $options: "i" } }).select("_id").limit(MAX_MATCHED_USERS).lean();
  return users.map((u) => u._id);
}

export async function listReports({ status, type, search, page, limit }) {
  const statusValue = asString(status) || "active";
  const typeValue = asString(type) || "all";
  const term = asString(search).trim().replace(/^#/, "").slice(0, MAX_SEARCH_LENGTH);

  if (!LIST_STATUSES.includes(statusValue)) throw createApiError(400, "Invalid status filter");
  if (!LIST_TYPES.includes(typeValue)) throw createApiError(400, "Invalid type filter");

  const filter = {};
  if (statusValue === "active") filter.status = { $in: ["open", "reviewing"] };
  else if (statusValue !== "all") filter.status = statusValue;
  if (typeValue !== "all") filter.targetType = typeValue;

  if (term) {
    const pattern = escapeRegex(term);
    const regex = { $regex: pattern, $options: "i" };
    const reporterIds = await findUserIdsByName(pattern);
    filter.$or = [
      { targetLabel: regex },
      { "contact.name": regex },
      { "contact.email": regex },
      ...(reporterIds.length ? [{ reporter: { $in: reporterIds } }] : []),
    ];
  }

  const pageNum = Math.max(1, parseInt(asString(page), 10) || 1);
  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(asString(limit), 10) || 10));
  // A moderation queue works oldest-first so nothing is left waiting; history is newest-first.
  const sort = statusValue === "active" ? { createdAt: 1, _id: 1 } : { createdAt: -1, _id: -1 };

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate("reporter", "name email avatar role")
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select("-__v -activeKey")
      .lean(),
    Report.countDocuments(filter),
  ]);

  return {
    reports,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.max(1, Math.ceil(total / limitNum)) },
  };
}

export async function getReportStats() {
  const rows = await Report.aggregate([
    { $group: { _id: { status: "$status", type: "$targetType" }, count: { $sum: 1 } } },
  ]);
  const sum = (predicate) => rows.filter((r) => predicate(r._id)).reduce((total, r) => total + r.count, 0);
  const isActive = (id) => id.status === "open" || id.status === "reviewing";

  return {
    open: sum((id) => id.status === "open"),
    reviewing: sum((id) => id.status === "reviewing"),
    resolved: sum((id) => id.status === "resolved"),
    dismissed: sum((id) => id.status === "dismissed"),
    activeProduct: sum((id) => isActive(id) && id.type === "product"),
    activeStore: sum((id) => isActive(id) && id.type === "store"),
    activeSupport: sum((id) => isActive(id) && id.type === "support"),
  };
}

export async function getReportById(reportId) {
  assertValidObjectId(reportId, "Invalid report id");

  const report = await Report.findById(reportId)
    .populate("reporter", "name email avatar role status")
    .populate("targetSeller", "name email status")
    .populate("reviewedBy", "name")
    .populate("resolution.by", "name")
    .select("-__v -activeKey")
    .lean();
  if (!report) throw createApiError(404, "Report not found");

  const sellerId = report.targetSeller?._id;
  const [sameTarget, sameSeller] = await Promise.all([
    report.targetType === "product"
      ? Report.countDocuments({ targetProduct: report.targetProduct, _id: { $ne: report._id } })
      : report.targetType === "store" && sellerId
        ? Report.countDocuments({ targetType: "store", targetSeller: sellerId, _id: { $ne: report._id } })
        : 0,
    sellerId ? Report.countDocuments({ targetSeller: sellerId, _id: { $ne: report._id } }) : 0,
  ]);

  // Is the reported thing still visible to customers right now?
  let target = null;
  if (report.targetType === "product" && report.targetProduct) {
    const product = await Product.findById(report.targetProduct).select("approvalStatus isPublished").lean();
    target = product
      ? { exists: true, live: product.approvalStatus === "approved" && product.isPublished }
      : { exists: false, live: false };
  } else if (report.targetType === "store") {
    target = report.targetSeller
      ? { exists: true, live: report.targetSeller.status === "active" }
      : { exists: false, live: false };
  }

  return { report, related: { sameTarget, sameSeller }, target };
}

export async function startReview(adminId, reportId) {
  assertValidObjectId(reportId, "Invalid report id");

  const report = await Report.findOneAndUpdate(
    { _id: reportId, status: "open" },
    { status: "reviewing", reviewedBy: adminId, reviewedAt: new Date() },
    { returnDocument: "after" }
  ).lean();

  if (!report) {
    throw createApiError((await Report.exists({ _id: reportId })) ? 409 : 404, (await Report.exists({ _id: reportId })) ? "This report is no longer open." : "Report not found");
  }
  return report;
}

export async function resolveReport(adminId, reportId, { outcome, note }) {
  assertValidObjectId(reportId, "Invalid report id");
  const now = new Date();

  // Atomic: only an open/reviewing report can be closed, and only once.
  const report = await Report.findOneAndUpdate(
    { _id: reportId, status: { $in: ["open", "reviewing"] } },
    {
      $set: { status: outcome, reviewedBy: adminId, reviewedAt: now, "resolution.note": note, "resolution.by": adminId, "resolution.at": now },
      $unset: { activeKey: 1 }, // frees the reporter to report the same thing again if it happens again
    },
    { returnDocument: "after" }
  ).lean();

  if (!report) {
    const exists = await Report.exists({ _id: reportId });
    throw createApiError(exists ? 409 : 404, exists ? "This report was already closed." : "Report not found");
  }

  notifyReporterReportResolved(report); // not awaited
  return report;
}