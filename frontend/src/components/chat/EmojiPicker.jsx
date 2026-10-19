import { useEffect, useRef } from "react";
import { EMOJIS } from "../../utils/chatUtils";

export function EmojiPicker({ onPick, onClose, anchorRef }) {
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (ref.current?.contains(e.target) || anchorRef?.current?.contains(e.target)) return;
      onClose();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose, anchorRef]);

  return (
    <div ref={ref} className="chat-slide-up absolute bottom-full left-0 mb-2 w-72 max-w-[85vw] bg-white border border-[#E5E5E5] rounded-2xl shadow-lg p-2 grid grid-cols-8 gap-1 z-20">
      {EMOJIS.map((emoji) => (
        <button key={emoji} type="button" onClick={() => onPick(emoji)} className="h-8 w-8 text-lg rounded-lg hover:bg-[#F5F5F5] hover:scale-110 transition">
          {emoji}
        </button>
      ))}
    </div>
  );
}