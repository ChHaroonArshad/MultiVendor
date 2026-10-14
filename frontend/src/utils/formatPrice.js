// Keep VITE_CURRENCY in sync with the currency your backend charges in
// (the Stripe PaymentIntent is created in "usd" today).
const CURRENCY = import.meta.env.VITE_CURRENCY || "USD";
const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY });

export function formatPrice(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? formatter.format(amount) : "";
}