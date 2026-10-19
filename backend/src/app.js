import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "../config/env.js";

import authRoutes from "../routes/authRoutes.js";
import productRoutes from "../routes/productRoutes.js";
import { errorMiddleware } from "../middleware/errorMiddleware.js";
import adminProductRoutes from "../routes/adminProductRoutes.js";
import publicProductRoutes from "../routes/publicProductRoutes.js";   // ADD THIS
import cartRoutes from "../routes/cartRoutes.js";
import checkoutRoutes from "../routes/checkoutRoutes.js";
import orderRoutes from "../routes/orderRoutes.js";
import stripeWebhookRoutes from '../routes/stripeWebhookRoutes.js'
import sellerOrderRoutes from "../routes/sellerOrderRoutes.js";
import adminOrderRoutes from "../routes/adminOrderRoutes.js";
import adminUserRoutes from "../routes/adminUserRoutes.js";
import adminOverviewRoutes from "../routes/adminOverviewRoutes.js";
import accountRoutes from "../routes/accountRoutes.js";
import sellerStoreRoutes from "../routes/sellerStoreRoutes.js";
import publicStoreRoutes from "../routes/publicStoreRoutes.js";
import notificationRoutes from "../routes/notificationRoutes.js";
import sellerOverviewRoutes from "../routes/sellerOverviewRoutes.js";
import customerOverviewRoutes from "../routes/customerOverviewRoutes.js";
import chatRoutes from "../routes/chatRoutes.js";
import reportRoutes from "../routes/reportRoutes.js";
import supportRoutes from "../routes/supportRoutes.js";
import adminReportRoutes from "../routes/adminReportRoutes.js";
import publicStatsRoutes from "../routes/publicStatsRoutes.js";












const app = express()

app.use("/api/v1/webhooks/stripe", stripeWebhookRoutes);

app.use(express.json());
app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
  res.json({ success: true, message: "API is healthy" });
});

app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/support", supportRoutes);
app.use("/api/v1/admin/reports", adminReportRoutes);
app.use("/api/v1/public", publicStatsRoutes);

app.use("/api/v1/chat", chatRoutes);

app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/seller/orders", sellerOrderRoutes);
app.use("/api/v1/admin/orders", adminOrderRoutes);
app.use("/api/v1/admin/users", adminUserRoutes);
app.use("/api/v1/admin/overview", adminOverviewRoutes);
app.use("/api/v1/notifications", notificationRoutes);

app.use("/api/v1/seller/store", sellerStoreRoutes);
app.use("/api/v1/stores", publicStoreRoutes);

app.use("/api/v1/account", accountRoutes);

app.use("/api/v1/seller/overview", sellerOverviewRoutes);
app.use("/api/v1/customer/overview", customerOverviewRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/seller/products", productRoutes);
app.use("/api/v1/admin/products", adminProductRoutes);
app.use("/api/v1/products", publicProductRoutes);  
app.use("/api/v1/checkout", checkoutRoutes);
app.use("/api/v1/orders", orderRoutes);                   
app.use(errorMiddleware);
export default app;