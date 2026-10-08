import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Spinner } from "../ui/Spinner";

const MENU_WIDTH = 184;
const ROW_HEIGHT = 38;

export function OrderActionsMenu({ order, busy, onView, onShip, onDeliver, onCancel }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const items = [{ key: "view", label: "View details", onClick: onView }];
  if (order.status === "processing") {
    items.push({ key: "ship", label: "Mark as shipped", onClick: onShip });
    items.push({ key: "cancel", label: "Cancel & refund", onClick: onCancel, danger: true });
  }
  if (order.status === "shipped") {
    items.push({ key: "deliver", label: "Mark as delivered", onClick: onDeliver });
  }

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    const handleOutside = (e) => {
      if (buttonRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      close();
    };
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const height = items.length * ROW_HEIGHT + 12;
    const openUp = window.innerHeight - rect.bottom < height + 8; // flip upward near the bottom of the screen
    setPosition({
      top: openUp ? rect.top - height - 4 : rect.bottom + 4,
      left: Math.max(8, rect.right - MENU_WIDTH),
    });
    setOpen(true);
  };

  // The menu closes itself first, then runs the action, so the two never race.
  const run = (fn) => {
    setOpen(false);
    fn();
  };

  if (busy) {
    return (
      <span className="w-8 h-8 inline-flex items-center justify-center text-[#6B6B6B]">
        <Spinner size={14} />
      </span>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label="Order actions"
        aria-haspopup="true"
        aria-expanded={open}
        className="w-8 h-8 rounded-full inline-flex items-center justify-center text-[#6B6B6B] hover:bg-[#F0F0F0] hover:text-[#111111] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: position.top, left: position.left, width: MENU_WIDTH }}
            className="bg-white border border-[#E5E5E5] rounded-2xl shadow-lg py-1.5 z-[80] animate-fade-slide-up"
          >
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => run(item.onClick)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-[#FAFAFA] transition-colors ${item.danger ? "text-red-500 hover:bg-red-50" : "text-[#111111]"}`}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}