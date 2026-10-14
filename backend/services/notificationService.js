import { User } from "../models/User.js";
import { transporter } from "../config/mailer.js";
import { env } from "../config/env.js";

const DEFAULT_PREFERENCES = {
  orderNotifications: true,
  orders: true,
  products: true,
  newSellerApplications: true,
  newProductSubmissions: true,
};

// Users created before preferences existed have no stored value, so fall back to the default.
const wants = (user, key) => user?.preferences?.[key] ?? DEFAULT_PREFERENCES[key] ?? false;

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (amount) => `$${Number(amount || 0).toFixed(2)}`;
const shortId = (id) => String(id).slice(-6).toUpperCase();

// Wraps a notifier so a failure is logged and never reaches the caller.
function safely(label, fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      console.error(`${label} failed:`, err.message);
    }
  };
}

// `paragraphs` are trusted HTML: callers must escapeHtml() every dynamic value they put in.
function renderEmail({ heading, paragraphs = [], highlight, ctaLabel, ctaPath, settingsPath }) {
  const danger = highlight?.tone === "danger";
  const box = highlight
    ? `<div style="background:${danger ? "#FBEAEA" : "#F7F7F7"}; border:1px solid ${danger ? "#F5C6C6" : "#E5E5E5"}; border-radius:12px; padding:16px; margin:16px 0;">
         <p style="color:${danger ? "#C0392B" : "#111111"}; font-size:13px; font-weight:bold; margin:0 0 6px 0;">${escapeHtml(highlight.label)}</p>
         <p style="color:${danger ? "#C0392B" : "#111111"}; font-size:14px; margin:0;">${highlight.lines.map(escapeHtml).join("<br>")}</p>
       </div>`
    : "";
  const button =
    ctaLabel && ctaPath
      ? `<a href="${env.clientUrl}${ctaPath}" style="display:inline-block; margin-top:8px; padding:12px 24px; background:#111111; color:#ffffff; text-decoration:none; border-radius:999px; font-size:14px;">${escapeHtml(ctaLabel)}</a>`
      : "";
  const footer = settingsPath
    ? `<p style="color:#B0B0B0; font-size:12px; margin-top:24px;">You can turn these emails off any time in <a href="${env.clientUrl}${settingsPath}" style="color:#C9A227;">Settings</a>.</p>`
    : "";

  return `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
    <h2 style="color:#111111;">${escapeHtml(heading)}</h2>
    ${paragraphs.map((p) => `<p style="color:#6B6B6B; font-size:14px; margin:0 0 12px 0;">${p}</p>`).join("")}
    ${box}${button}${footer}
  </div>`;
}

async function send(to, subject, content) {
  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html: renderEmail(content) });
  } catch (err) {
    console.error(`Email "${subject}" to ${to} failed:`, err.message); // one bad recipient must not stop the rest
  }
}

const findAdmins = () => User.find({ role: "admin", status: "active" }).select("name email preferences").lean();

// ---------- admins ----------

export const notifyAdminsNewSeller = safely("new seller admin email", async (seller) => {
  const admins = await findAdmins();
  await Promise.all(
    admins
      .filter((admin) => wants(admin, "newSellerApplications"))
      .map((admin) =>
        send(admin.email, "A new seller registered", {
          heading: "New seller registered",
          paragraphs: [`<strong style="color:#111111;">${escapeHtml(seller.name)}</strong> (${escapeHtml(seller.email)}) just signed up as a seller.`],
          ctaLabel: "View sellers",
          ctaPath: "/admin/sellers",
          settingsPath: "/admin/settings",
        })
      )
  );
});

export const notifyAdminsNewProduct = safely("new product admin email", async (product) => {
  const [admins, seller] = await Promise.all([findAdmins(), User.findById(product.seller).select("name").lean()]);
  await Promise.all(
    admins
      .filter((admin) => wants(admin, "newProductSubmissions"))
      .map((admin) =>
        send(admin.email, `New product awaiting review: ${product.name}`, {
          heading: "Product awaiting review",
          paragraphs: [`<strong style="color:#111111;">${escapeHtml(seller?.name || "A seller")}</strong> submitted <strong style="color:#111111;">${escapeHtml(product.name)}</strong> for approval.`],
          ctaLabel: "Review product",
          ctaPath: `/admin/products/${product._id}`,
          settingsPath: "/admin/settings",
        })
      )
  );
});

// ---------- sellers ----------

export const notifySellerProductDecision = safely("product decision email", async (product, decision, reason) => {
  const sellerId = product.seller?._id ?? product.seller;
  const seller = await User.findById(sellerId).select("name email preferences").lean();
  if (!seller || !wants(seller, "products")) return;

  const approved = decision === "approved";
  await send(
    seller.email,
    approved ? `Your product "${product.name}" was approved` : `Your product "${product.name}" was not approved`,
    {
      heading: approved ? "Product approved" : "Product not approved",
      paragraphs: [
        approved
          ? `Hi ${escapeHtml(seller.name)}, <strong style="color:#111111;">${escapeHtml(product.name)}</strong> was approved and is now live in the marketplace.`
          : `Hi ${escapeHtml(seller.name)}, <strong style="color:#111111;">${escapeHtml(product.name)}</strong> was reviewed and was not approved. You can update the listing and resubmit it.`,
      ],
      highlight: approved ? undefined : { tone: "danger", label: "Reason", lines: [reason || "No reason was provided."] },
      ctaLabel: "Open product",
      ctaPath: `/seller/products/${product._id}`,
      settingsPath: "/seller/settings",
    }
  );
});

export const notifySellersOrdersPaid = safely("new order seller email", async (orders) => {
  for (const order of orders) {
    const seller = await User.findById(order.seller).select("name email preferences").lean();
    if (!seller || !wants(seller, "orders")) continue;

    await send(seller.email, `New order #${shortId(order._id)}`, {
      heading: "You have a new order",
      paragraphs: [`Hi ${escapeHtml(seller.name)}, a customer just paid for order <strong style="color:#111111;">#${shortId(order._id)}</strong>.`],
      highlight: {
        tone: "neutral",
        label: `Total ${money(order.subtotal)}`,
        lines: order.items.map((item) => `${item.name} × ${item.quantity}`),
      },
      ctaLabel: "Open order",
      ctaPath: `/seller/orders/${order._id}`,
      settingsPath: "/seller/settings",
    });
  }
});

// ---------- customers ----------

const CUSTOMER_COPY = {
  shipped: (id) => ({ subject: `Your order #${id} is on its way`, heading: "Your order has shipped", text: "The seller has shipped your order. It is on its way to you." }),
  delivered: (id) => ({ subject: `Your order #${id} was delivered`, heading: "Your order was delivered", text: "Your order has been marked as delivered. We hope you enjoy it!" }),
  cancelled: (id) => ({ subject: `Your order #${id} was cancelled and refunded`, heading: "Your order was cancelled", text: "The seller cancelled your order and your payment has been refunded." }),
};

export const notifyCustomerOrderStatus = safely("customer order email", async (order, status) => {
  const copy = CUSTOMER_COPY[status];
  if (!copy) return;

  const buyerId = order.buyer?._id ?? order.buyer;
  const buyer = await User.findById(buyerId).select("name email preferences").lean();
  if (!buyer) return;

  const alwaysSend = status === "cancelled"; // refunds are money-related, so the switch does not apply
  if (!alwaysSend && !wants(buyer, "orderNotifications")) return;

  const id = shortId(order._id);
  const { subject, heading, text } = copy(id);
  await send(buyer.email, subject, {
    heading,
    paragraphs: [`Hi ${escapeHtml(buyer.name)}, ${text}`],
    highlight: {
      tone: status === "cancelled" ? "danger" : "neutral",
      label: status === "cancelled" ? `Refunded ${money(order.subtotal)}` : `Order #${id}`,
      lines: order.items.map((item) => `${item.name} × ${item.quantity}`),
    },
    ctaLabel: "View order",
    ctaPath: `/customer/orders/${order._id}`,
    settingsPath: alwaysSend ? undefined : "/customer/settings",
  });
});