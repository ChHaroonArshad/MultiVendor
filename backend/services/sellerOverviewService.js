import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const TIMEZONE = process.env.REPORT_TIMEZONE || "UTC";
const LOW_STOCK_LIMIT = 5;
const PLACED = ["paid", "refunded"];

const money = (n) => Math.round((n || 0) * 100) / 100;
const percentChange = (current, previous) => (previous > 0 ? Math.round(((current - previous) / previous) * 100) : null);
const dayKey = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const weekdayLabel = (date) => new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, weekday: "short" }).format(date);

export async function getSellerOverview(sellerId, range) {
  const sid = new mongoose.Types.ObjectId(sellerId); // aggregate() does not cast ids for us
  const days = range === "30" ? 30 : 7;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const twoWeeksAgo = new Date(now.getTime() - 14 * DAY_MS);
  const chartFrom = new Date(now.getTime() - (days + 1) * DAY_MS);

  const paidBetween = async (from, to) => {
    const rows = await Order.aggregate([
      { $match: { seller: sid, paymentStatus: "paid", createdAt: { $gte: from, $lt: to } } },
      { $group: { _id: null, total: { $sum: "$subtotal" } } },
    ]);
    return rows[0]?.total || 0;
  };
  const placedBetween = (from, to) =>
    Order.countDocuments({ seller: sid, paymentStatus: { $in: PLACED }, createdAt: { $gte: from, $lt: to } });

  const live = { seller: sid, approvalStatus: "approved", isPublished: true };

  const [
    totalsRows, placedTotal, revenueWeek, revenuePrev, ordersWeek, ordersPrev, toFulfil,
    dailyRows, statusRows, topRows, recentOrders,
    liveCount, hiddenCount, pendingCount, rejectedCount, totalProducts, outOfStock, lowStock,
  ] = await Promise.all([
    Order.aggregate([{ $match: { seller: sid, paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$subtotal" }, count: { $sum: 1 } } }]),
    Order.countDocuments({ seller: sid, paymentStatus: { $in: PLACED } }),
    paidBetween(weekAgo, now),
    paidBetween(twoWeeksAgo, weekAgo),
    placedBetween(weekAgo, now),
    placedBetween(twoWeeksAgo, weekAgo),
    Order.countDocuments({ seller: sid, paymentStatus: "paid", status: "processing" }),
    Order.aggregate([
      { $match: { seller: sid, paymentStatus: "paid", createdAt: { $gte: chartFrom } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TIMEZONE } },
          revenue: { $sum: "$subtotal" },
          orders: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: { seller: sid, paymentStatus: { $in: PLACED } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { seller: sid, paymentStatus: "paid" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          image: { $first: "$items.image" },
          units: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { units: -1, revenue: -1 } },
      { $limit: 5 },
    ]),
    Order.find({ seller: sid, paymentStatus: { $in: PLACED } })
      .sort({ createdAt: -1 })
      .limit(6)
      .select("buyer subtotal status paymentStatus createdAt")
      .populate("buyer", "name"),
    Product.countDocuments(live),
    Product.countDocuments({ seller: sid, approvalStatus: "approved", isPublished: { $ne: true } }),
    Product.countDocuments({ seller: sid, approvalStatus: "pending" }),
    Product.countDocuments({ seller: sid, approvalStatus: "rejected" }),
    Product.countDocuments({ seller: sid }),
    Product.countDocuments({ seller: sid, approvalStatus: "approved", stock: 0 }),
    Product.find({ seller: sid, approvalStatus: "approved", stock: { $lte: LOW_STOCK_LIMIT } })
      .sort({ stock: 1 })
      .limit(5)
      .select("name stock images isPublished"),
  ]);

  const byDay = new Map(dailyRows.map((r) => [r._id, r]));
  const trend = Array.from({ length: days }, (_, i) => {
    const date = new Date(now.getTime() - (days - 1 - i) * DAY_MS);
    const row = byDay.get(dayKey(date));
    return { date: dayKey(date), label: weekdayLabel(date), revenue: money(row?.revenue), orders: row?.orders || 0 };
  });

  const countOf = (status) => statusRows.find((r) => r._id === status)?.count || 0;
  const paidCount = totalsRows[0]?.count || 0;

  return {
    generatedAt: now.toISOString(),
    range: String(days),
    stats: {
      revenue: { total: money(totalsRows[0]?.total), week: money(revenueWeek), change: percentChange(revenueWeek, revenuePrev) },
      orders: { total: placedTotal, week: ordersWeek, change: percentChange(ordersWeek, ordersPrev), toFulfil },
      averageOrder: paidCount ? money((totalsRows[0]?.total || 0) / paidCount) : 0,
    },
    trend,
    statusBreakdown: {
      processing: countOf("processing"),
      shipped: countOf("shipped"),
      delivered: countOf("delivered"),
      cancelled: countOf("cancelled"),
    },
    topProducts: topRows.map((p) => ({ id: p._id, name: p.name, image: p.image || "", units: p.units, revenue: money(p.revenue) })),
    recentOrders: recentOrders.map((o) => ({
      id: o._id,
      customer: o.buyer?.name || "Deleted user",
      date: o.createdAt,
      status: o.paymentStatus === "refunded" ? "refunded" : o.status,
      amount: money(o.subtotal),
    })),
    products: {
      total: totalProducts,
      live: liveCount,
      hidden: hiddenCount,
      pending: pendingCount,
      rejected: rejectedCount,
      outOfStock,
      lowStockLimit: LOW_STOCK_LIMIT,
      lowStock: lowStock.map((p) => ({ id: p._id, name: p.name, stock: p.stock, image: p.images?.[0]?.url || "", published: !!p.isPublished })),
    },
  };
}