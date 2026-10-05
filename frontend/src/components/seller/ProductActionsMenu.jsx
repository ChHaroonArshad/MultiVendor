import { useEffect, useRef } from "react";
import { Spinner } from "../ui/Spinner";

export function ProductActionsMenu({ product, open, onToggle, onClose, onEdit, onView, onDelete, onTogglePublish, publishing }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  const canPublishToggle = product.approvalStatus === "approved";

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        aria-label="Product actions"
        aria-haspopup="true"
        aria-expanded={open}
        className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

    {open && (
  <div
    className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E5E5E5] rounded-2xl shadow-lg py-1.5 z-[9999]"
    onMouseDown={(e) => {
      e.stopPropagation();
    }}
    onClick={(e) => {
      e.stopPropagation();
    }}
  >
    {canPublishToggle && (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onTogglePublish();
        }}
        disabled={publishing}
        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-[#FAFAFA] ${
          product.isPublished ? "text-red-500" : "text-[#2E7D32]"
        }`}
      >
        {publishing && <Spinner size={12} />}
        {product.isPublished ? "Unpublish" : "Publish"}
      </button>
    )}

    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("EDIT CLICKED");
        onEdit();
      }}
      className="w-full text-left px-4 py-2 text-sm text-[#111111] hover:bg-[#FAFAFA]"
    >
      Edit
    </button>

    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("VIEW CLICKED");
        onView();
      }}
      className="w-full text-left px-4 py-2 text-sm text-[#111111] hover:bg-[#FAFAFA]"
    >
      View
    </button>

    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("DELETE CLICKED");
        onDelete();
      }}
      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
    >
      Delete
    </button>
  </div>
)}
    </div>
  );
}