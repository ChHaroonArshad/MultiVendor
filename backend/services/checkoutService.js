import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { createApiError } from "../utils/apiError.js";

export async function createOrderFromCart(userId, shippingAddress) {
    const cart = await Cart.findOne({ user: userId }).populate({
        path: "items.product",
        select: "name price originalPrice images stock approvalStatus isPublished seller",
        populate: { path: "seller", select: "name" },
    });

    if (!cart || cart.items.length === 0) {
        throw createApiError(400, "Your cart is empty");
    }

    // Same validity filter the cart itself already applies on read, checked
    // again here as the final gate before money/stock actually move.
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

    // Group cart items by seller — this is the multi-vendor split.
    const bySeller = new Map();
    for (const item of validItems) {
        const sellerId = item.product.seller._id.toString();
        if (!bySeller.has(sellerId)) bySeller.set(sellerId, []);
        bySeller.get(sellerId).push(item);
    }

    const orderGroupId = new mongoose.Types.ObjectId().toString();
    const session = await mongoose.startSession();
    let createdOrders = [];

    try {
        await session.withTransaction(async () => {
            createdOrders = [];

            for (const [sellerId, items] of bySeller.entries()) {
                const orderItems = [];

                for (const item of items) {
                    // Atomic, conditional decrement: only succeeds if stock is still
                    // sufficient AT THE MOMENT this runs. Prevents overselling even
                    // if two customers check out the same low-stock item simultaneously.
                    const updatedProduct = await Product.findOneAndUpdate(
                        { _id: item.product._id, stock: { $gte: item.quantity } },
                        { $inc: { stock: -item.quantity } },
                        { returnDocument: "after", session }
                    );
                    if (!updatedProduct) {
                        // Someone else bought it between our read and this write — abort everything.
                        throw createApiError(
                            409,
                            `"${item.product.name}" just sold out or dropped in stock. Please review your cart and try again.`
                        );
                    }

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

                const [order] = await Order.create(
                    [{
                        orderGroupId,
                        buyer: userId,
                        seller: sellerId,
                        items: orderItems,
                        shippingAddress,
                        subtotal,
                    }],
                    { session }
                );
                createdOrders.push(order);
            }

            cart.items = [];
            await cart.save({ session });
        });
    } finally {
        session.endSession();
    }

    return { orderGroupId, orders: createdOrders };
}

export async function getMyOrders(userId) {
    const orders = await Order.find({ buyer: userId }).sort({ createdAt: -1 });
    // Group sibling orders from the same checkout back into one logical "order" for the UI
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