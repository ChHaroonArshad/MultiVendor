const ROLE_HOME = {
  customer: "/customer",
  seller: "/seller",
  admin: "/admin",
};

export function getHomeForRole(role) {
  return ROLE_HOME[role] || ROLE_HOME.customer;
}

export function getSafeRedirect(path, fallback) {
  const isInternal =
    typeof path === "string" && path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
  return isInternal ? path : fallback;
}

export function getPurchaseBlockMessage(role) {
  if (role === "seller") {
    return "You're signed in with a seller account. Switch to a customer account to make purchases.";
  }
  if (role === "admin") {
    return "Admin accounts are for managing the marketplace and can't make purchases.";
  }
  return null; // customer or guest → no block here (guest is handled at checkout instead)
}