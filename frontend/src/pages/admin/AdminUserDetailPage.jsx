import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser, suspendUser, reactivateUser } from "../../services/adminUserApi";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { RoleBadge } from "../../components/admin/RoleBadge";
import { Avatar } from "../../components/ui/Avatar";
import { CopyButton } from "../../components/ui/CopyButton";
import { ReasonModal } from "../../components/ui/ReasonModal";
import { ConfirmActionModal } from "../../components/ui/ConfirmActionModal";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../context/ToastContext";

function activityTiles(activity) {
  if (activity.type === "seller") {
    return [
      { label: "Products", value: activity.products.total },
      { label: "Approved", value: activity.products.approved },
      { label: "Pending review", value: activity.products.pending },
      { label: "Rejected", value: activity.products.rejected },
      { label: "Orders", value: activity.orders },
      { label: "Revenue", value: `$${activity.revenue.toFixed(2)}` },
    ];
  }
  if (activity.type === "customer") {
    return [
      { label: "Orders", value: activity.orders },
      { label: "Total spent", value: `$${activity.totalSpent.toFixed(2)}` },
    ];
  }
  return [];
}

export function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState(null); // { user, activity }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getUser(id)
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load user."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleSuspend = async (reason) => {
    setActing(true);
    try {
      const res = await suspendUser(id, reason);
      setData((prev) => ({ ...prev, user: res.data.user }));
      showToast("User suspended and notified by email");
      setSuspendOpen(false);
    } catch (err) {
      showToast(err.message || "Failed to suspend user.", "error");
    } finally {
      setActing(false);
    }
  };

  const handleReactivate = async () => {
    setActing(true);
    try {
      const res = await reactivateUser(id);
      setData((prev) => ({ ...prev, user: res.data.user }));
      showToast("User reactivated and notified by email");
      setReactivateOpen(false);
    } catch (err) {
      showToast(err.message || "Failed to reactivate user.", "error");
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-2">
        <Spinner size={16} className="text-[#6B6B6B]" />
        <p className="text-sm text-[#6B6B6B]">Loading user...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-600 mb-3">{error || "User not found."}</p>
        <button onClick={() => navigate("/admin/users")} className="text-xs font-medium text-[#C9A227] hover:underline">← Back to Users</button>
      </div>
    );
  }

  const { user, activity } = data;
  const tiles = activityTiles(activity);

  return (
    <div className="max-w-4xl space-y-5">
      <button onClick={() => navigate("/admin/users")} className="text-xs text-[#6B6B6B] hover:text-[#111111]">← Back to Users</button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar name={user.name} size={56} />
          <div className="min-w-0">
            <h1 className="text-xl font-serif text-[#111111] truncate">{user.name}</h1>
            <p className="text-sm text-[#6B6B6B] truncate mb-1.5">{user.email}</p>
            <div className="flex items-center gap-2">
              <RoleBadge role={user.role} />
              <AdminStatusBadge status={user.status} />
            </div>
          </div>
        </div>

        {user.role !== "admin" && (
          <div className="shrink-0 flex flex-wrap items-center gap-2">
            {user.status === "active" ? (
              <button onClick={() => setSuspendOpen(true)} disabled={acting} className="text-sm font-medium px-5 py-2.5 rounded-full border border-[#E5E5E5] text-[#C0392B] hover:border-[#C0392B]/50 transition-colors disabled:opacity-50">
                Suspend account
              </button>
            ) : (
              <button onClick={() => setReactivateOpen(true)} disabled={acting} className="text-sm font-medium px-5 py-2.5 rounded-full bg-[#111111] text-white hover:opacity-90 transition-all disabled:opacity-50">
                Reactivate account
              </button>
            )}

            {user.role === "seller" && (
              <button
                onClick={() => navigate(`/admin/messages?seller=${user._id}`)}
                className="text-sm font-medium px-5 py-2.5 rounded-full border border-[#E5E5E5] hover:border-[#C9A227]/50 transition-colors"
              >
                Message seller
              </button>
            )}

          </div>
        )}
      </div>

      {user.status === "suspended" && (
        <div className="border border-red-200 bg-red-50 rounded-2xl px-4 py-3">
          <p className="text-sm text-red-600 font-medium mb-0.5">
            Suspended{user.suspendedAt ? ` on ${new Date(user.suspendedAt).toLocaleString()}` : ""}
          </p>
          {user.suspensionReason && <p className="text-sm text-red-600">{user.suspensionReason}</p>}
        </div>
      )}

      <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5">
        <p className="text-xs text-[#6B6B6B] mb-4">Account</p>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <p className="text-xs text-[#B0B0B0] mb-0.5">Joined</p>
            <p className="text-[#111111]">{new Date(user.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-[#B0B0B0] mb-0.5">Sign-in method</p>
            <p className="text-[#111111]">{user.signInMethod}</p>
          </div>
          <div>
            <p className="text-xs text-[#B0B0B0] mb-0.5">Email</p>
            <p className={user.isEmailVerified ? "text-[#2E7D32]" : "text-[#B98900]"}>{user.isEmailVerified ? "Verified" : "Not verified"}</p>
          </div>
          <div>
            <p className="text-xs text-[#B0B0B0] mb-0.5">User ID</p>
            <div className="flex items-center gap-1.5">
              <p className="text-[#111111] text-xs font-mono truncate">{user._id}</p>
              <CopyButton text={user._id} toastMessage="User ID copied" label="Copy user ID" />
            </div>
          </div>
        </div>
      </div>

      {tiles.length > 0 && (
        <div>
          <p className="text-xs text-[#6B6B6B] mb-3">Activity</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {tiles.map((t) => (
              <div key={t.label} className="bg-white border border-[#E5E5E5] rounded-2xl p-4">
                <p className="text-xs text-[#6B6B6B] mb-1">{t.label}</p>
                <p className="text-xl font-serif text-[#111111]">{t.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ReasonModal
        open={suspendOpen}
        title={`Suspend ${user.name}?`}
        description="They will be signed out everywhere and emailed this reason. They won't be able to sign in until you reactivate them."
        placeholder="e.g. Repeated policy violations, fraudulent activity..."
        confirmLabel="Suspend & notify"
        submitting={acting}
        onSubmit={handleSuspend}
        onCancel={() => setSuspendOpen(false)}
      />

      <ConfirmActionModal
        open={reactivateOpen}
        title={`Reactivate ${user.name}?`}
        message="They will be able to sign in again and will be notified by email."
        confirmLabel="Reactivate"
        loading={acting}
        onConfirm={handleReactivate}
        onCancel={() => setReactivateOpen(false)}
      />
    </div>
  );
}