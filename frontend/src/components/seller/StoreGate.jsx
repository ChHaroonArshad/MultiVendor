import { Navigate, Outlet } from "react-router-dom";
import { useSellerStore } from "../../hooks/useSellerStore";
import { Spinner } from "../ui/Spinner";

// A layout route: sends a seller with an unfinished store to the store page.
// `reason` travels in router state so the store page can explain why they landed there.
export function StoreGate({ reason }) {
  const { status, completion } = useSellerStore();

  if (status === "loading") {
    return (
      <div className="py-24 flex items-center justify-center gap-2">
        <Spinner size={16} className="text-[#6B6B6B]" />
        <p className="text-sm text-[#6B6B6B]">Loading...</p>
      </div>
    );
  }

  // If the check itself failed we let the page render. The backend still blocks product creation.
if (status === "ready" && completion && !completion.complete) {
    return <Navigate to="/seller/store" replace state={{ reason }} />;
  }

  return <Outlet />;
}