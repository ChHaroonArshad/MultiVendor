import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { createApiError } from "../utils/apiError.js";
import { stripe } from "../config/stripeConfig.js";

async function restoreStock(items) {
  await Promise.all(
    items.map((item) => Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }))
  );
}

export async function createOrderFromCart(userId, shippingAddress) {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name price originalPrice images stock approvalStatus isPublished seller",
    populate: { path: "seller", select: "name" },
  });

  if (!cart || cart.items.length === 0) {
    throw createApiError(400, "Your cart is empty");
  }

  const validItems = cart.items.filter(
    (item) => item.product && item.product.approvalStatus === "approved" && item.product.isPublished
  );
  if (validItems.length !== cart.items.length) {
    throw createApiError(400, "Some items in your cart are no longer available. Please review your cart.");
  }

  const overStockItem = validItems.find((item) => item.quantity > item.product.stock);
  if (overStockItem) {
    throw createApiError(
      400,
      `"${overStockItem.product.name}" only has ${overStockItem.product.stock} left in stock. Please adjust the quantity.`
    );
  }

  const bySeller = new Map();
  for (const item of validItems) {
    const sellerId = item.product.seller._id.toString();
    if (!bySeller.has(sellerId)) bySeller.set(sellerId, []);
    bySeller.get(sellerId).push(item);
  }

  const orderGroupId = new mongoose.Types.ObjectId().toString();
  const createdOrders = [];
  const decrementedStock = [];
  let grandTotal = 0;
  let paymentIntent = null;

  try {
    for (const [sellerId, items] of bySeller.entries()) {
      const orderItems = [];

      for (const item of items) {
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.product._id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { returnDocument: "after" }
        );

        if (!updatedProduct) {
          throw createApiError(
            409,
            `"${item.product.name}" just sold out or dropped in stock. Please review your cart and try again.`
          );
        }

        decrementedStock.push({ productId: item.product._id, quantity: item.quantity });

        orderItems.push({
          product: item.product._id,
          name: item.product.name,
          image: item.product.images?.[0]?.url || "",
          price: item.product.price,
          quantity: item.quantity,
          subtotal: item.product.price * item.quantity,
        });
      }

      const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
      grandTotal += subtotal;

      const order = await Order.create({
        orderGroupId,
        buyer: userId,
        seller: sellerId,
        items: orderItems,
        shippingAddress,
        subtotal,
      });
      createdOrders.push(order);
    }

    // Stripe is called INSIDE the try block, before the cart is cleared. If Stripe
    // fails (network, bad key), everything below in the catch is rolled back and
    // the customer still has their cart.
    paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(grandTotal * 100),
      currency: "usd",
      metadata: { orderGroupId, buyerId: userId.toString() },
    });

    await Order.updateMany({ orderGroupId }, { stripePaymentIntentId: paymentIntent.id });

    cart.items = [];
    await cart.save();
  } catch (err) {
    await Promise.all(
      decrementedStock.map(({ productId, quantity }) =>
        Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } })
      )
    );
    if (createdOrders.length > 0) {
      await Order.deleteMany({ _id: { $in: createdOrders.map((o) => o._id) } });
    }
    if (paymentIntent) {
      try {
        await stripe.paymentIntents.cancel(paymentIntent.id);
      } catch {
        // an unused intent that nobody holds a secret for is harmless
      }
    }
    throw err;
  }

  return { orderGroupId, orders: createdOrders, clientSecret: paymentIntent.client_secret };
}

export async function getMyOrders(userId) {
  const orders = await Order.find({ buyer: userId }).sort({ createdAt: -1 });
  const grouped = new Map();
  for (const order of orders) {
    if (!grouped.has(order.orderGroupId)) grouped.set(order.orderGroupId, []);
    grouped.get(order.orderGroupId).push(order);
  }
  return Array.from(grouped.entries()).map(([orderGroupId, sellerOrders]) => ({ orderGroupId, sellerOrders }));
}

export async function getMyOrderGroup(userId, orderGroupId) {
  const sellerOrders = await Order.find({ orderGroupId, buyer: userId });
  if (sellerOrders.length === 0) throw createApiError(404, "Order not found");
  return { orderGroupId, sellerOrders };
}

// Only moves orders that are still waiting for payment. An order that was already
// cancelled (expired) or already paid is never touched again.
export async function markOrderGroupPaid(orderGroupId) {
  await Order.updateMany(
    { orderGroupId, status: "pending", paymentStatus: "unpaid" },
    { paymentStatus: "paid", status: "processing" }
  );
}

async function cancelUnpaidOrderGroup(orderGroupId) {
  const orders = await Order.find({ orderGroupId, status: "pending", paymentStatus: "unpaid" });
  for (const order of orders) {
    // Atomic claim: only the caller that flips pending -> cancelled restores the stock,
    // so two overlapping cleanups can never restore it twice.
    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, status: "pending", paymentStatus: "unpaid" },
      { status: "cancelled" },
      { returnDocument: "after" }
    );
    if (claimed) await restoreStock(claimed.items);
  }
}

export async function markOrderGroupFailed(orderGroupId) {
  await cancelUnpaidOrderGroup(orderGroupId);
}

export async function confirmPaymentStatus(userId, orderGroupId) {
  const orders = await Order.find({ orderGroupId, buyer: userId });
  if (orders.length === 0) throw createApiError(404, "Order not found");

  const paymentIntentId = orders[0].stripePaymentIntentId;
  if (!paymentIntentId) throw createApiError(400, "No payment associated with this order");

  // Ask Stripe directly: this is the source of truth, not the browser.
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status === "succeeded") {
    await markOrderGroupPaid(orderGroupId);
  } else if (paymentIntent.status === "canceled") {
    await markOrderGroupFailed(orderGroupId);
  }
  // Any other status (e.g. requires_payment_method after a declined card) leaves the
  // order pending so the customer can retry with another card.

  return Order.find({ orderGroupId, buyer: userId });
}

// Releases stock held by checkouts that were never paid, and also rescues payments
// that succeeded on Stripe but whose confirm call never reached us.
export async function reconcileStaleUnpaidOrders(olderThanMinutes = 30) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const groupIds = await Order.distinct("orderGroupId", {
    status: "pending",
    paymentStatus: "unpaid",
    createdAt: { $lt: cutoff },
  });

  for (const orderGroupId of groupIds) {
    try {
      const sample = await Order.findOne({ orderGroupId });
      const paymentIntentId = sample?.stripePaymentIntentId;

      if (paymentIntentId) {
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (intent.status === "succeeded") {
          await markOrderGroupPaid(orderGroupId);
          continue;
        }
        if (intent.status === "processing") continue; // still settling, check again next run

        if (intent.status !== "canceled") {
          // closes the door so the customer cannot pay for an order we are about to cancel
          await stripe.paymentIntents.cancel(paymentIntentId);
        }
      }

      await cancelUnpaidOrderGroup(orderGroupId);
    } catch (err) {
      console.error(`Could not reconcile order group ${orderGroupId}:`, err.message);
    }
  }
}




export async function retryPayment(userId, orderGroupId) {
  const orders = await Order.find({ orderGroupId, buyer: userId });
  if (orders.length === 0) throw createApiError(404, "Order not found");

  const first = orders[0];
  if (first.status !== "pending" || first.paymentStatus !== "unpaid") {
    throw createApiError(400, "This order is not awaiting payment and cannot be retried");
  }

  const amount = orders.reduce((sum, o) => sum + o.subtotal, 0);

  // Reuse the existing PaymentIntent if Stripe still considers it payable —
  // avoids creating a second, orphaned intent for the same order.
  let paymentIntent = null;
  if (first.stripePaymentIntentId) {
    try {
      const existing = await stripe.paymentIntents.retrieve(first.stripePaymentIntentId);
      if (["requires_payment_method", "requires_confirmation", "requires_action"].includes(existing.status)) {
        paymentIntent = existing;
      }
    } catch {
      // intent no longer retrievable — fall through and create a fresh one
    }
  }

  if (!paymentIntent) {
    paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      metadata: { orderGroupId, buyerId: userId.toString() },
    });
    await Order.updateMany({ orderGroupId }, { stripePaymentIntentId: paymentIntent.id });
  }
return { orderGroupId, clientSecret: paymentIntent.client_secret, amount };
}