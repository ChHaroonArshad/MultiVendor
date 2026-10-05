import { useCallback, useState } from "react";
import { useAuth } from "./useAuth";
import { getPurchaseBlockMessage } from "../utils/roleUtils";

// Centralizes the "can this person actually buy something?" check so every
// Add to Cart / Buy Now button in the app shares one rule instead of each
// component re-implementing the guest/seller/admin logic separately.
export function usePurchaseGuard() {
  const { user } = useAuth();
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [blockedRole, setBlockedRole] = useState(null);
  const [sellerMessage, setSellerMessage] = useState(null);

  const guardedAction = useCallback(
    (action) => {
      if (!user) {
        setGuestModalOpen(true);
        return;
      }
      if (user.role === "seller" || user.role === "admin") {
        setBlockedRole(user.role);
        setSellerMessage(getPurchaseBlockMessage(user.role));
        return;
      }
      action();
    },
    [user]
  );

  return {
    guardedAction,
    guestModalOpen,
    closeGuestModal: () => setGuestModalOpen(false),
    sellerMessage,
    blockedRole,
    closeSellerModal: () => {
      setSellerMessage(null);
      setBlockedRole(null);
    },
  };
}