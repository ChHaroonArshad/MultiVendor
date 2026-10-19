export const idOf = (value) => String(value?._id ?? value ?? "");

// The side comes from the verified JWT + the conversation, NEVER from anything the client sends.
export function getSide(conversation, user) {
  const id = String(user.userId);
  if (conversation.type === "direct") {
    if (idOf(conversation.customer) === id) return "customer";
    if (idOf(conversation.seller) === id) return "seller";
    return null; // admins cannot read private buyer-seller chats
  }
  if (user.role === "admin") return "admin"; // support inbox: shared by all admins
  if (idOf(conversation.seller) === id) return "seller";
  return null;
}

export function otherSideOf(conversation, side) {
  if (conversation.type === "direct") return side === "customer" ? "seller" : "customer";
  return side === "seller" ? "admin" : "seller";
}