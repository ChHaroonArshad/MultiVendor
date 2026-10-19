import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Cart } from "../models/Cart.js";

const MINUTE_MS = 60 * 1000;
const TIMEZONE = process.env.REPORT_TIMEZONE || "UTC";
const HOLD_MINUTES = Number(process.env.UNPAID_ORDER_TTL_MINUTES) || 30;
const PLACED = ["paid", "refunded"];

const money = (n) => Math.round((n || 0) * 100) / 100;
const percentChange = (current, previous) => (previous > 0 ? Math.round(((current - previous) / previous) * 100) : null);
const monthKey = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit" }).format(date);
const monthShort = (date) => new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, month: "short" }).format(date);
const monthLong = (date) => new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, month: "long", year: "numeric" }).format(date);

function toOrderDto(o) {
  const first = o.items?.[0];
  return {
    id: o._id,
    name: first?.name || "Order",
    image: first?.image || "",
    itemCount: o.items?.length || 0,
    seller: o.seller?.name || "Unknown seller",
    date: o.createdAt,
    status: o.paymentStatus === "refunded" ? "refunded" : o.status,
    amount: money(o.subtotal),
  };
}

export async function getCustomerOverview(buyerId) {
  const bid = new mongoose.Types.ObjectId(buyerId);
  const now = new Date();

  // Last 6 calendar months, oldest first. Mid-month dates avoid timezone edge cases.
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 15, 12);
    return { key: monthKey(d), label: monthShort(d), title: monthLong(d) };
  });
  const monthsFrom = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  const [
    totalsRows, placedTotal, inProgress, delivered, statusRows, monthRows,
    recentOrders, onTheWay, awaitingRows, cart,
  ] = await Promise.all([
    Order.aggregate([{ $match: { buyer: bid, paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$subtotal" } } }]),
    Order.countDocuments({ buyer: bid, paymentStatus: { $in: PLACED } }),
    Order.countDocuments({ buyer: bid, paymentStatus: "paid", status: { $in: ["processing", "shipped"] } }),
    Order.countDocuments({ buyer: bid, paymentStatus: "paid", status: "delivered" }),
    Order.aggregate([
      { $match: { buyer: bid, paymentStatus: { $in: PLACED } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { buyer: bid, paymentStatus: "paid", createdAt: { $gte: monthsFrom } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: TIMEZONE } },
          spent: { $sum: "$subtotal" },
          orders: { $sum: 1 },
        },
      },
    ]),
    Order.find({ buyer: bid, paymentStatus: { $in: PLACED } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("seller items subtotal status paymentStatus createdAt")
      .populate("seller", "name"),
    Order.find({ buyer: bid, paymentStatus: "paid", status: "shipped" })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("seller items subtotal status paymentStatus createdAt")
      .populate("seller", "name"),
    // One row per checkout (orderGroupId), because paying covers every seller's slice at once.
    Order.aggregate([
      { $match: { buyer: bid, status: "pending", paymentStatus: "unpaid" } },
      {
        $group: {
          _id: "$orderGroupId",
          total: { $sum: "$subtotal" },
          createdAt: { $min: "$createdAt" },
          orderId: { $first: "$_id" },
          items: { $sum: { $size: "$items" } },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 3 },
    ]),
    Cart.findOne({ user: bid }).select("items"),
  ]);

  const byMonth = new Map(monthRows.map((r) => [r._id, r]));
  const spending = months.map((m) => ({ ...m, spent: money(byMonth.get(m.key)?.spent), orders: byMonth.get(m.key)?.orders || 0 }));
  const thisMonth = spending[spending.length - 1].spent;
  const lastMonth = spending[spending.length - 2].spent;
  const countOf = (status) => statusRows.find((r) => r._id === status)?.count || 0;

  return {
    generatedAt: now.toISOString(),
    stats: {
      totalSpent: money(totalsRows[0]?.total),
      thisMonth,
      monthChange: percentChange(thisMonth, lastMonth),
      orders: placedTotal,
      inProgress,
      delivered,
      cartItems: cart?.items?.length || 0,
    },
    spending,
    statusBreakdown: {
      processing: countOf("processing"),
      shipped: countOf("shipped"),
      delivered: countOf("delivered"),
      cancelled: countOf("cancelled"),
    },
    recentOrders: recentOrders.map(toOrderDto),
    onTheWay: onTheWay.map(toOrderDto),
    awaitingPayment: awaitingRows.map((g) => ({
      orderId: g.orderId,
      total: money(g.total),
      items: g.items,
      payBy: new Date(g.createdAt.getTime() + HOLD_MINUTES * MINUTE_MS).toISOString(),
    })),
  };
}