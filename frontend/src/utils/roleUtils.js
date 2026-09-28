export function getHomeForRole(role) {
  if (role === "seller") return "/dashboard/seller";
  if (role === "admin") return "/dashboard/admin";
  return "/dashboard";
}

// Only allow redirects to paths inside our own app (blocks open-redirect tricks
// like "//evil.com" or "/\evil.com")
export function getSafeRedirect(path, fallback) {
  const isInternal =
    typeof path === "string" && path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
  return isInternal ? path : fallback;
}