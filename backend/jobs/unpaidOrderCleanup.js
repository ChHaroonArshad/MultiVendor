import { reconcileStaleUnpaidOrders } from "../services/checkoutService.js";

const RUN_EVERY_MS = 5 * 60 * 1000;
const STALE_AFTER_MINUTES = 30;

let timer = null;
let running = false;

async function run() {
  if (running) return;
  running = true;
  try {
    await reconcileStaleUnpaidOrders(STALE_AFTER_MINUTES);
  } catch (err) {
    console.error("Unpaid order cleanup failed:", err.message);
  } finally {
    running = false;
  }
}

export function startUnpaidOrderCleanup() {
  if (timer) return;
  run();
  timer = setInterval(run, RUN_EVERY_MS);
  timer.unref?.();
}