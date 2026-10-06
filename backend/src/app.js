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
// ...

// ...
// ...
const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
  res.json({ success: true, message: "API is healthy" });
});
app.use("/api/v1/cart", cartRoutes);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/seller/products", productRoutes);
app.use("/api/v1/admin/products", adminProductRoutes);
app.use("/api/v1/products", publicProductRoutes);  
app.use("/api/v1/checkout", checkoutRoutes);
app.use("/api/v1/orders", orderRoutes);                   
app.use(errorMiddleware);
export default app;