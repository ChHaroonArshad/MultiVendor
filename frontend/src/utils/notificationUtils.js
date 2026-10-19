export function timeAgo(dateInput) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateInput).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateInput).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function getNotificationsPath(role) {
  if (role === "seller") return "/seller/notifications";
  if (role === "admin") return "/admin/notifications";
  return "/customer/notifications";
}

// Only follow links that stay inside our own app (blocks "//evil.com" style values).
export const isInternalLink = (link) => typeof link === "string" && link.startsWith("/") && !link.startsWith("//");