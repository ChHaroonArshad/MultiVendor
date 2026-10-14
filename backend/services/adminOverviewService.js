import { User } from "../models/User.js"; // match your actual User model file name
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const TIMEZONE = process.env.REPORT_TIMEZONE || "UTC"; // decides where "a day" starts and ends
const LOW_STOCK_LIMIT = 5;
const PLACED = ["paid", "refunded"]; // orders that were really paid for at some point

const money = (n) => Math.round((n || 0) * 100) / 100;
const percentChange = (current, previous) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null; // null = nothing to compare with

const dayKey = (date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const weekdayLabel = (date) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, weekday: "short" }).format(date);

async function paidBetween(from, to) {
  const rows = await Order.aggregate([
    { $match: { paymentStatus: "paid", createdAt: { $gte: from, $lt: to } } },
    { $group: { _id: null, total: { $sum: "$subtotal" } } },
  ]);
  return rows[0]?.total || 0;
}

const placedBetween = (from, to) =>
  Order.countDocuments({ paymentStatus: { $in: PLACED }, createdAt: { $gte: from, $lt: to } });

const usersBetween = (role, from, to) =>
  User.countDocuments({ role, createdAt: { $gte: from, $lt: to } });

export async function getAdminOverview() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const twoWeeksAgo = new Date(now.getTime() - 14 * DAY_MS);
  const chartFrom = new Date(now.getTime() - 8 * DAY_MS);
  const live = { approvalStatus: "approved", isPublished: true };

  const [
    revenueAllRows, placedTotal, revenueWeek, revenuePrev, ordersWeek, ordersPrev,
    customersTotal, sellersTotal, customersWeek, customersPrev, sellersWeek, sellersPrev,
    dailyRows, recentOrders, pendingCount, pendingProducts, topSellerRows,
    publishedCount, outOfStock, lowStock, awaitingPayment, suspended,
  ] = await Promise.all([
    Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$subtotal" } } }]),
    Order.countDocuments({ paymentStatus: { $in: PLACED } }),
    paidBetween(weekAgo, now),
    paidBetween(twoWeeksAgo, weekAgo),
    placedBetween(weekAgo, now),
    placedBetween(twoWeeksAgo, weekAgo),
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "seller" }),
    usersBetween("customer", weekAgo, now),
    usersBetween("customer", twoWeeksAgo, weekAgo),
    usersBetween("seller", weekAgo, now),
    usersBetween("seller", twoWeeksAgo, weekAgo),
    Order.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: chartFrom } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TIMEZONE } },
          revenue: { $sum: "$subtotal" },
          orders: { $sum: 1 },
        },
      },
    ]),
    Order.find({ paymentStatus: { $in: PLACED } })
      .sort({ createdAt: -1 })
      .limit(6)
      .select("buyer seller subtotal status paymentStatus createdAt")
      .populate("buyer", "name")
      .populate("seller", "name"),
    Product.countDocuments({ approvalStatus: "pending" }),
    Product.find({ approvalStatus: "pending" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name seller createdAt")
      .populate("seller", "name"),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: "$seller", revenue: { $sum: "$subtotal" }, orders: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: User.collection.name, localField: "_id", foreignField: "_id", as: "seller" } },
      { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, revenue: 1, orders: 1, name: { $ifNull: ["$seller.name", "Deleted seller"] } } },
    ]),
    Product.countDocuments(live),
    Product.countDocuments({ ...live, stock: 0 }),
    Product.countDocuments({ ...live, stock: { $gt: 0, $lte: LOW_STOCK_LIMIT } }),
    Order.countDocuments({ status: "pending", paymentStatus: "unpaid" }),
    User.countDocuments({ status: "suspended" }), // assumes your user field is `status`
  ]);

  // Always 7 points, even for days with no sales.
  const byDay = new Map(dailyRows.map((r) => [r._id, r]));
  const trend = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getTime() - (6 - i) * DAY_MS);
    const row = byDay.get(dayKey(date));
    return { date: dayKey(date), label: weekdayLabel(date), revenue: money(row?.revenue), orders: row?.orders || 0 };
  });

  return {
    generatedAt: now.toISOString(),
    timezone: TIMEZONE,
    stats: {
      revenue: { total: money(revenueAllRows[0]?.total), week: money(revenueWeek), change: percentChange(revenueWeek, revenuePrev) },
      orders: { total: placedTotal, week: ordersWeek, change: percentChange(ordersWeek, ordersPrev) },
      customers: { total: customersTotal, week: customersWeek, change: percentChange(customersWeek, customersPrev) },
      sellers: { total: sellersTotal, week: sellersWeek, change: percentChange(sellersWeek, sellersPrev) },
    },
    trend,
    recentOrders: recentOrders.map((o) => ({
      id: o._id,
      customer: o.buyer?.name || "Deleted user",
      seller: o.seller?.name || "Deleted seller",
      date: o.createdAt,
      status: o.paymentStatus === "refunded" ? "refunded" : o.status,
      amount: money(o.subtotal),
    })),
    pending: {
      total: pendingCount,
      products: pendingProducts.map((p) => ({
        id: p._id,
        name: p.name,
        seller: p.seller?.name || "Unknown seller",
        submittedOn: p.createdAt,
      })),
    },
    topSellers: topSellerRows.map((s) => ({ id: s._id, name: s.name, revenue: money(s.revenue), orders: s.orders })),
    health: { published: publishedCount, outOfStock, lowStock, lowStockLimit: LOW_STOCK_LIMIT, awaitingPayment, suspended },
  };
}