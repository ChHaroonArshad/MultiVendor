import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { Spinner } from "../ui/Spinner";
import { deleteAccount } from "../../services/accountApi";
import { inputClass, labelClass } from "./settingsUi";

export function DeleteAccountSection({ extraWarning }) {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    if (busy) return;
    setOpen(false);
    setPassword("");
    setConfirmation("");
    setError("");
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await deleteAccount({ password: password || undefined, confirmation });
      try { await logout(); } catch { /* the server already cleared the cookies */ }
      showToast("Your account has been deleted");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Could not delete your account.");
      setBusy(false);
    }
  };

  return (
    <>
      <div className="border border-red-200 rounded-2xl p-5 bg-red-50/40">
        <p className="text-sm font-medium text-red-600 mb-1">Danger zone</p>
        <p className="text-xs text-[#6B6B6B] mb-4">
          Deleting your account is permanent and cannot be undone. {extraWarning}
        </p>
        <button onClick={() => setOpen(true)} className="text-xs font-medium border border-red-300 text-red-600 px-4 py-2 rounded-full hover:bg-red-50 transition-colors">
          Delete account
        </button>
      </div>

      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={close}>
          <form onSubmit={handleDelete} className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E5E5] p-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium text-[#111111] mb-1">Delete your account?</p>
            <p className="text-xs text-[#6B6B6B] mb-5">
              Your order history stays on file for the other party, but your profile and personal data are removed. {extraWarning}
            </p>

            {error && <div className="mb-4 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs">{error}</div>}

            <div className="space-y-4 mb-5">
              <div>
                <label htmlFor="delete-password" className={labelClass}>Password</label>
                <input id="delete-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass(false)} />
                <p className="text-[11px] text-[#B0B0B0] mt-1.5 ml-1">If you only ever signed in with Google, leave this empty.</p>
              </div>
              <div>
                <label htmlFor="delete-confirm" className={labelClass}>Type DELETE to confirm</label>
                <input id="delete-confirm" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="off" className={inputClass(false)} />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={close} disabled={busy} className="flex-1 text-xs font-medium border border-[#E5E5E5] py-2.5 rounded-full hover:border-[#C9A227]/50 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={busy || confirmation !== "DELETE"} className="flex-1 text-xs font-medium bg-red-500 text-white py-2.5 rounded-full hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {busy && <Spinner size={12} />}
                {busy ? "Deleting..." : "Delete forever"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}