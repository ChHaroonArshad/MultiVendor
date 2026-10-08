import { createApiError } from "../utils/apiError.js";
import { constructStripeEvent, handleStripeEvent } from "../services/stripeWebhookService.js";

export async function stripeWebhook(req, res, next) {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = constructStripeEvent(req.body, signature); // req.body must be the RAW buffer here, not parsed JSON
  } catch (err) {
    return next(createApiError(400, `Webhook signature verification failed: ${err.message}`));
  }

  try {
    await handleStripeEvent(event);
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}