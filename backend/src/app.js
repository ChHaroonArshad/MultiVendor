import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "../config/env.js";

import authRoutes from "../routes/authRoutes.js";
import { errorMiddleware } from "../middleware/errorMiddleware.js";

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
  res.json({ success: true, message: "API is healthy" });
});

app.use("/api/v1/auth", authRoutes);

app.use(errorMiddleware); 
export default app;