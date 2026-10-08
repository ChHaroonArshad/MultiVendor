import { stripe } from "../config/stripeConfig.js";
import { env } from "../config/env.js";
import { markOrderGroupPaid, markOrderGroupFailed } from "./checkoutService.js";

export function constructStripeEvent(rawBody, signature) {
  return stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
}

export async function handleStripeEvent(event) {
  const orderGroupId = event.data.object?.metadata?.orderGroupId;
  if (!orderGroupId) return;

  switch (event.type) {
    case "payment_intent.succeeded":
      await markOrderGroupPaid(orderGroupId);
      break;
    case "payment_intent.canceled":
      await markOrderGroupFailed(orderGroupId);
      break;
    // payment_intent.payment_failed is intentionally NOT handled. It fires on every
    // declined attempt, and the customer may retry with another card on the same
    // intent. Abandoned orders are cleaned up by the stale-order job instead.
    default:
      break;
  }
}