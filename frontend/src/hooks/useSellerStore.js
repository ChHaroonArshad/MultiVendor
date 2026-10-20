import { useContext } from "react";
import { SellerStoreContext } from "../context/SellerStoreContext";

export function useSellerStore() {
  const context = useContext(SellerStoreContext);
  if (!context) throw new Error("useSellerStore must be used inside <SellerStoreProvider>");
  return context;
}