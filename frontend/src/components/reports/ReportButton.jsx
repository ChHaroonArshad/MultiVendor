import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { FlagIcon } from "../icons/FlagIcon";
import { ReportModal } from "./ReportModal";

export function ReportButton({ targetType, targetId, targetName, ownerId, variant = "text", label }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const viewerId = user?._id || user?.id;
  if (user?.role === "admin") return null; // admins moderate directly
  if (ownerId && viewerId && String(ownerId) === String(viewerId)) return null; // no reporting your own listing

  const text = label || `Report ${targetType}`;

  const handleClick = () => {
    if (!user) {
      showToast("Please sign in to send a report.", "error");
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    setOpen(true);
  };

  const styles =
    variant === "outline"
      ? "border border-[#E5E5E5] bg-white px-4 py-2 rounded-full text-xs font-medium text-[#6B6B6B] hover:border-red-200 hover:text-red-500"
      : "text-xs text-[#6B6B6B] hover:text-red-500";

  return (
    <>
      <button type="button" onClick={handleClick} className={`group inline-flex items-center gap-1.5 transition-colors ${styles}`}>
        <FlagIcon size={14} className="group-hover:animate-flag-wave" />
        {text}
      </button>
      <ReportModal open={open} onClose={() => setOpen(false)} targetType={targetType} targetId={targetId} targetName={targetName} />
    </>
  );
}