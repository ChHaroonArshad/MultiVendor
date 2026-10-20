export const MAX_IMAGE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎", "🤔", "😅", "😭", "😡",
  "👍", "👎", "🙏", "👏", "🙌", "💪", "🔥", "✨", "🎉", "❤️", "💯", "✅",
  "❌", "⚠️", "📦", "🚚", "💳", "🛒", "⭐", "😴", "🤝", "👌", "😉", "🥳",
  "😬", "🤗", "😇", "🙂", "😮", "😢", "😤", "🤩", "🥰", "🙈", "👀", "🎁",
];

export function newClientId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, "");
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`.padEnd(16, "0");
}

export function isSameDay(a, b) {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatListTime(date) {
  const d = new Date(date);
  const now = new Date();
  if (isSameDay(d, now)) return formatTime(d);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return "Yesterday";
  if ((now - d) / 86400000 < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

export function dayLabel(date) {
  const d = new Date(date);
  const now = new Date();
  if (isSameDay(d, now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
}

export function getQuickReplies(viewerRole, conversationType) {
  if (viewerRole === "customer") {
    return ["Is this still available?", "Can you ship today?", "Do you offer a discount?", "Can I see more photos?"];
  }
  if (viewerRole === "seller" && conversationType === "support") {
    return ["I need help with a product approval", "I have a question about an order", "I'd like to report an issue"];
  }
  if (viewerRole === "seller") {
    return ["Thanks for your order! 🎉", "Your order is being packed.", "Your order has been shipped.", "Is there anything I can help with?"];
  }
  return ["Thanks for reaching out. How can I help?", "We're looking into this now.", "Could you share more details?"];
}

export const EDIT_WINDOW_MS = 15 * 60 * 1000;

export const CATEGORY_LABEL = {
  harassment: "Harassment or abuse",
  scam: "Scam or fraud",
  spam: "Spam",
  inappropriate: "Inappropriate content",
  off_platform: "Deal outside the marketplace",
  other: "Something else",
};