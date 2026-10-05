import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .toast-item { animation: toastSlideIn 0.25s ease-out; }
      `}</style>
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-item pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium shadow-lg max-w-xs ${t.type === "error" ? "bg-red-500 text-white" : "bg-[#111111] text-white"}`}
          >
            <span>{t.message}</span>
            <button onClick={() => dismissToast(t.id)} className="text-white/70 hover:text-white text-xs leading-none">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}