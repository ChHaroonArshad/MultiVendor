// frontend/src/hooks/useClickOutside.js
import { useEffect, useRef } from "react";

// Attach to any dropdown/menu: returns a ref to put on the menu's wrapper.
// Closes via `onClose` when a click lands anywhere outside that wrapper.
export function useClickOutside(isOpen, onClose) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  return ref;
}