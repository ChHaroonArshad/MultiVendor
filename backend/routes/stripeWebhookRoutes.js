import { Router } from "express";
import express from "express";
import { stripeWebhook } from "../controllers/stripeWebhookController.js";

const router = Router();

// RAW body, NOT JSON — Stripe's signature check needs the exact untouched
// bytes of the request body. If express.json() parses it first, the
// signature will never match and every webhook call will fail.
router.post("/", express.raw({ type: "application/json" }), stripeWebhook);

export default router;