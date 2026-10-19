import { User } from "../models/User.js";
import { transporter } from "../config/mailer.js";
import { env } from "../config/env.js";
import { createNotification } from "./inAppNotificationService.js";

const DEFAULT_PREFERENCES = {
  orderNotifications: true,
  orders: true,
  products: true,
  newSellerApplications: true,
  newProductSubmissions: true,
};
import { REASON_LABELS } from "../utils/reportConstants.js";
// Users created before preferences existed have no stored value, so fall back to the default.
const wants = (user, key) => user?.preferences?.[key] ?? DEFAULT_PREFERENCES[key] ?? false;

// Emails only. In-app messages are plain text and React escapes them, so they must NOT be escaped here.
const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (amount) => `$${Number(amount || 0).toFixed(2)}`;
const shortId = (id) => String(id).slice(-6).toUpperCase();
const itemsSummary = (items) => (items.length === 1 ? items[0].name : `${items[0].name} + ${items.length - 1} more`);

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

// Runs the in-app notification and the email independently: one failing never blocks the other.
async function deliver(label, tasks) {
  const results = await Promise.allSettled(tasks);
  results.forEach((result) => {
    if (result.status === "rejected") console.error(`${label} failed:`, result.reason?.message);
  });
}

const findAdmins = () => User.find({ role: "admin", status: "active" }).select("name email preferences").lean();

// ---------- admins ----------

export const notifyAdminsNewSeller = safely("new seller notification", async (seller) => {
  const admins = (await findAdmins()).filter((admin) => wants(admin, "newSellerApplications"));
  await Promise.all(
    admins.map((admin) =>
      deliver("new seller notification", [
        createNotification({
          userId: admin._id,
          type: "seller_registered",
          title: "New seller registered",
          message: `${seller.name} (${seller.email}) signed up as a seller.`,
          link: `/admin/users/${seller._id}`,
          dedupeKey: `seller-registered:${seller._id}`,
        }),
        send(admin.email, "A new seller registered", {
          heading: "New seller registered",
          paragraphs: [`<strong style="color:#111111;">${escapeHtml(seller.name)}</strong> (${escapeHtml(seller.email)}) just signed up as a seller.`],
          ctaLabel: "View sellers",
          ctaPath: "/admin/sellers",
          settingsPath: "/admin/settings",
        }),
      ])
    )
  );
});

// Call this when a seller SUBMITS their verification application.
export const notifyAdminsNewSellerApplication = safely("seller application notification", async (seller) => {
  const admins = (await findAdmins()).filter((admin) => wants(admin, "newSellerApplications"));
  await Promise.all(
    admins.map((admin) =>
      deliver("seller application notification", [
        createNotification({
          userId: admin._id,
          type: "seller_application_submitted",
          title: "Seller verification submitted",
          message: `${seller.name} submitted their seller verification for review.`,
          link: "/admin/sellers",
        }),
        send(admin.email, "A seller application is waiting for review", {
          heading: "Seller application waiting",
          paragraphs: [`<strong style="color:#111111;">${escapeHtml(seller.name)}</strong> submitted their verification documents.`],
          ctaLabel: "Review application",
          ctaPath: "/admin/sellers",
          settingsPath: "/admin/settings",
        }),
      ])
    )
  );
});

export const notifyAdminsNewProduct = safely("new product notification", async (product) => {
  const [admins, seller] = await Promise.all([findAdmins(), User.findById(product.seller).select("name").lean()]);
  const sellerName = seller?.name || "A seller";

  await Promise.all(
    admins
      .filter((admin) => wants(admin, "newProductSubmissions"))
      .map((admin) =>
        deliver("new product notification", [
          createNotification({
            userId: admin._id,
            type: "product_submitted",
            title: "Product awaiting review",
            message: `${sellerName} submitted "${product.name}" for approval.`,
            link: `/admin/products/${product._id}`,
          }),
          send(admin.email, `New product awaiting review: ${product.name}`, {
            heading: "Product awaiting review",
            paragraphs: [`<strong style="color:#111111;">${escapeHtml(sellerName)}</strong> submitted <strong style="color:#111111;">${escapeHtml(product.name)}</strong> for approval.`],
            ctaLabel: "Review product",
            ctaPath: `/admin/products/${product._id}`,
            settingsPath: "/admin/settings",
          }),
        ])
      )
  );
});

// ---------- sellers ----------

export const notifySellerProductDecision = safely("product decision notification", async (product, decision, reason) => {
  const sellerId = product.seller?._id ?? product.seller;
  const seller = await User.findById(sellerId).select("name email preferences").lean();
  if (!seller || !wants(seller, "products")) return;

  const approved = decision === "approved";
  await deliver("product decision notification", [
    createNotification({
      userId: seller._id,
      type: approved ? "product_approved" : "product_rejected",
      title: approved ? "Product approved" : "Product not approved",
      message: approved ? `"${product.name}" is now live in the marketplace.` : `"${product.name}" was rejected: ${reason || "no reason given"}`,
      link: `/seller/products/${product._id}`,
    }),
    send(
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
    ),
  ]);
});

export const notifySellersOrdersPaid = safely("new order notification", async (orders) => {
  for (const order of orders) {
    const seller = await User.findById(order.seller).select("name email preferences").lean();
    if (!seller || !wants(seller, "orders")) continue;

    await deliver("new order notification", [
      createNotification({
        userId: seller._id,
        type: "order_new",
        title: "You have a new order",
        message: `Order #${shortId(order._id)}: ${itemsSummary(order.items)} · ${money(order.subtotal)}`,
        link: `/seller/orders/${order._id}`,
        dedupeKey: `order-new:${order._id}`, // confirm call, webhook and cleanup job can race: only one survives
      }),
      send(seller.email, `New order #${shortId(order._id)}`, {
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
      }),
    ]);
  }
});

// Verification decisions: the email is sent by emailService, this adds ONLY the in-app item.
export const notifySellerApplicationDecisionInApp = safely("application decision notification", async (sellerId, decision, reason) => {
  const id = sellerId?._id ?? sellerId;
  const approved = decision === "approved";
  await createNotification({
    userId: id,
    type: approved ? "seller_application_approved" : "seller_application_rejected",
    title: approved ? "Seller application approved" : "Seller application not approved",
    message: approved ? "You can now add products and start selling." : `Your application was rejected: ${reason || "no reason given"}`,
    link: approved ? "/seller/products" : "/seller/verification",
  });
});

// ---------- customers ----------

const CUSTOMER_COPY = {
  shipped: (id) => ({
    type: "order_shipped",
    subject: `Your order #${id} is on its way`,
    heading: "Your order has shipped",
    text: "The seller has shipped your order. It is on its way to you.",
    inAppTitle: "Your order has shipped",
    inAppMessage: `Order #${id} is on its way.`,
  }),
  delivered: (id) => ({
    type: "order_delivered",
    subject: `Your order #${id} was delivered`,
    heading: "Your order was delivered",
    text: "Your order has been marked as delivered. We hope you enjoy it!",
    inAppTitle: "Your order was delivered",
    inAppMessage: `Order #${id} was marked as delivered.`,
  }),
  cancelled: (id, amount) => ({
    type: "order_cancelled",
    subject: `Your order #${id} was cancelled and refunded`,
    heading: "Your order was cancelled",
    text: "The seller cancelled your order and your payment has been refunded.",
    inAppTitle: "Your order was cancelled",
    inAppMessage: `Order #${id} was cancelled and ${money(amount)} was refunded.`,
  }),
};

export const notifyCustomerOrderStatus = safely("customer order notification", async (order, status) => {
  const makeCopy = CUSTOMER_COPY[status];
  if (!makeCopy) return;

  const buyerId = order.buyer?._id ?? order.buyer;
  const buyer = await User.findById(buyerId).select("name email preferences").lean();
  if (!buyer) return;

  const alwaysSend = status === "cancelled"; // refunds are money-related, so the switch does not apply
  if (!alwaysSend && !wants(buyer, "orderNotifications")) return;

  const id = shortId(order._id);
  const copy = makeCopy(id, order.subtotal);

  await deliver("customer order notification", [
    createNotification({
      userId: buyer._id,
      type: copy.type,
      title: copy.inAppTitle,
      message: copy.inAppMessage,
      link: `/customer/orders/${order._id}`,
      dedupeKey: `${copy.type}:${order._id}`, // each transition happens once per order
    }),
    send(buyer.email, copy.subject, {
      heading: copy.heading,
      paragraphs: [`Hi ${escapeHtml(buyer.name)}, ${copy.text}`],
      highlight: {
        tone: status === "cancelled" ? "danger" : "neutral",
        label: status === "cancelled" ? `Refunded ${money(order.subtotal)}` : `Order #${id}`,
        lines: order.items.map((item) => `${item.name} × ${item.quantity}`),
      },
      ctaLabel: "View order",
      ctaPath: `/customer/orders/${order._id}`,
      settingsPath: alwaysSend ? undefined : "/customer/settings",
    }),
  ]);
});

// ---------- any user ----------

// Reactivation email is sent by emailService, this adds ONLY the in-app item
// (suspension itself has none: a suspended user is signed out and could never read it).
export const notifyAccountReactivatedInApp = safely("reactivation notification", async (userId) => {
  await createNotification({
    userId: userId?._id ?? userId,
    type: "account_reactivated",
    title: "Your account was reactivated",
    message: "Your account is active again. Welcome back!",
  });
});


// ---------- reports ----------

// Moderation is not optional, so admins have no switch for this one.
export const notifyAdminsNewReport = safely("new report notification", async (report) => {
  const admins = await findAdmins();
  const reason = REASON_LABELS[report.reason] || report.reason;
  const isSupport = report.targetType === "support";
  const who = report.contact?.name || "a user";

  const results = await Promise.allSettled(
    admins.map((admin) =>
      createNotification({
        userId: admin._id,
        type: "report_submitted",
        title: isSupport ? "New support request" : `New ${report.targetType} report`,
        message: isSupport ? `${reason}, from ${who}` : `"${report.targetLabel}" was reported: ${reason}`,
        link: `/admin/reports/${report._id}`,
        dedupeKey: `report-submitted:${report._id}`,
      })
    )
  );
  results.forEach((r) => { if (r.status === "rejected") console.error("report notification failed:", r.reason?.message); });
});

// Fixed wording on purpose: the admin's internal note and the seller's identity are never exposed.
export const notifyReporterReportResolved = safely("report resolved notification", async (report) => {
  if (!report.reporter) return; // a guest support request has no account to notify
  const reporterId = report.reporter?._id ?? report.reporter;
  const isSupport = report.targetType === "support";
  const dismissed = report.status === "dismissed";

  await createNotification({
    userId: reporterId,
    type: "report_resolved",
    title: isSupport ? "Your support request was handled" : "Your report was reviewed",
    message: isSupport
      ? "Our team has closed your request. If you still need help, send us another message."
      : dismissed
        ? `We reviewed your report about "${report.targetLabel}" and found no violation. Thank you for letting us know.`
        : `We reviewed your report about "${report.targetLabel}" and took action where needed. Thank you for helping keep the marketplace safe.`,
    link: isSupport ? "/help" : null,
    dedupeKey: `report-resolved:${report._id}`,
  });
});