import { useState } from "react";
import { useToast } from "../../context/ToastContext";

export function CopyButton({ text, toastMessage = "Copied", label = "Copy" }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast(toastMessage);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast("Couldn't copy to clipboard", "error");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      title={label}
      className="w-6 h-6 rounded-md flex items-center justify-center text-[#B0B0B0] hover:text-[#111111] hover:bg-[#F0F0F0] transition-colors"
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}