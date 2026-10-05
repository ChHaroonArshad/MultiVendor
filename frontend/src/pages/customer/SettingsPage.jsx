// frontend/src/pages/customer/SettingsPage.jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../hooks/useAuth";
import { changePassword as changePasswordRequest } from "../../services/authApi";

const fieldClass = "w-full px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all";

export function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Profile");
  const [profile, setProfile] = useState({ name: user?.name || "", phone: "", dob: "", gender: "" });
  const [profileStatus, setProfileStatus] = useState("idle");
  const [prefs, setPrefs] = useState({ orderNotifications: true, promoEmails: false, reviewReminders: true, recommendations: true });
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("usd");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm();
  const [serverError, setServerError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const saveProfile = (e) => {
    e.preventDefault();
    setProfileStatus("saving");
    setTimeout(() => setProfileStatus("saved"), 600);
  };

  const onChangePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    setServerError("");
    setPwSuccess(false);
    if (newPassword !== confirmPassword) { setServerError("New passwords do not match."); return; }
    setPwLoading(true);
    try {
      await changePasswordRequest({ currentPassword, newPassword });
      setPwSuccess(true);
      reset();
    } catch (err) {
      setServerError(err.message || "Unable to reach the server. Please try again.");
    } finally {
      setPwLoading(false);
    }
  };

  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "—";

  return (
    <div className="animate-fade-slide-up">
      <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-6">Settings</h1>

      <div className="flex gap-2 mb-8 border-b border-[#E5E5E5] overflow-x-auto">
        {["Profile", "Security", "Preferences", "Account"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 text-sm px-1 pb-3 border-b-2 transition-colors duration-200 ${tab === t ? "border-[#C9A227] text-[#111111] font-medium" : "border-transparent text-[#6B6B6B]"}`}>{t}</button>
        ))}
      </div>

      {tab === "Profile" && (
        <form onSubmit={saveProfile} className="space-y-5 max-w-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#111111] text-white flex items-center justify-center text-xl font-serif">{user?.name?.charAt(0).toUpperCase() || "U"}</div>
            <button type="button" className="text-xs font-medium border border-[#E5E5E5] px-4 py-2 rounded-full hover:border-[#C9A227]/50 transition-colors">Change photo</button>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Full name</label>
            <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={fieldClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Email address</label>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-[#F3F3F3] text-sm text-[#6B6B6B]">
              <span>{user?.email}</span>
              {user?.isEmailVerified && <span className="text-[10px] uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Verified</span>}
            </div>
            <p className="text-[11px] text-[#B0B0B0] mt-1.5">Your email address is linked to your account and cannot currently be changed.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Phone</label>
              <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+1 (555) 000-0000" className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Date of birth</label>
              <input type="date" value={profile.dob} onChange={(e) => setProfile({ ...profile, dob: e.target.value })} className={fieldClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Gender</label>
            <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })} className={fieldClass}>
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={profileStatus === "saving"} className="text-sm font-medium bg-[#111111] text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-all disabled:opacity-50">{profileStatus === "saving" ? "Saving..." : "Save Changes"}</button>
            {profileStatus === "saved" && <span className="text-xs text-emerald-600">Saved</span>}
          </div>
        </form>
      )}

      {tab === "Security" && (
        <div className="max-w-lg space-y-8">
          <div>
            <p className="text-sm font-medium text-[#111111] mb-1">Change Password</p>
            <p className="text-xs text-[#6B6B6B] mb-4">Other devices will be signed out after you change it.</p>
            {pwSuccess && <div className="mb-4 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">Password changed successfully.</div>}
            {serverError && <div className="mb-4 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm">{serverError}</div>}
            <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Current password</label>
                <input type="password" {...register("currentPassword", { required: true })} className={fieldClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">New password</label>
                <input type="password" {...register("newPassword", { required: true, minLength: 8 })} className={fieldClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Confirm new password</label>
                <input type="password" {...register("confirmPassword", { required: true })} className={fieldClass} />
              </div>
              <button type="submit" disabled={pwLoading} className="text-sm font-medium bg-[#111111] text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-all disabled:opacity-50">{pwLoading ? "Updating..." : "Update Password"}</button>
            </form>
          </div>
          <div className="border-t border-[#E5E5E5] pt-6 space-y-3">
            {["Active Sessions", "Login Activity", "Two-Factor Authentication"].map((label) => (
              <div key={label} className="flex items-center justify-between p-4 border border-[#E5E5E5] rounded-2xl bg-white opacity-70">
                <p className="text-sm font-medium text-[#111111]">{label}</p>
                <span className="text-[10px] uppercase bg-[#F3F3F3] text-[#6B6B6B] px-2.5 py-1 rounded-full shrink-0">Coming soon</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Preferences" && (
        <div className="max-w-lg space-y-6">
          <div className="space-y-3">
            {[
              { key: "orderNotifications", label: "Order Notifications" },
              { key: "promoEmails", label: "Promotional Emails" },
              { key: "reviewReminders", label: "Review Reminders" },
              { key: "recommendations", label: "Product Recommendations" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 border border-[#E5E5E5] rounded-2xl bg-white">
                <p className="text-sm font-medium text-[#111111]">{item.label}</p>
                <button type="button" role="switch" aria-checked={prefs[item.key]} onClick={() => setPrefs((p) => ({ ...p, [item.key]: !p[item.key] }))} className={`w-10 h-6 rounded-full transition-colors duration-200 relative shrink-0 ${prefs[item.key] ? "bg-[#C9A227]" : "bg-[#E5E5E5]"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${prefs[item.key] ? "left-[18px]" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className={fieldClass}>
                <option value="en">English</option><option value="ur">Urdu</option><option value="es">Spanish</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={fieldClass}>
                <option value="usd">USD ($)</option><option value="eur">EUR (€)</option><option value="gbp">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {tab === "Account" && (
        <div className="max-w-lg space-y-6">
          <div className="border border-[#E5E5E5] rounded-2xl bg-white divide-y divide-[#E5E5E5]">
            {[
              ["Account Type", user?.role === "customer" ? "Customer" : user?.role],
              ["Email Verification", user?.isEmailVerified ? "Verified" : "Not verified"],
              ["Account Status", user?.status === "suspended" ? "Suspended" : "Active"],
              ["Member Since", memberSince],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-5 py-3.5 text-sm">
                <span className="text-[#6B6B6B]">{label}</span><span className="text-[#111111] font-medium">{value}</span>
              </div>
            ))}
          </div>
          <div className="border border-red-200 rounded-2xl p-5 bg-red-50/40">
            <p className="text-sm font-medium text-red-600 mb-1">Danger Zone</p>
            <p className="text-xs text-[#6B6B6B] mb-4">Deleting your account is permanent and cannot be undone.</p>
            <button onClick={() => setConfirmOpen(true)} className="text-xs font-medium border border-red-300 text-red-600 px-4 py-2 rounded-full hover:bg-red-50 transition-colors">Delete Account</button>
          </div>
          {confirmOpen && (
            <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setConfirmOpen(false)}>
              <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E5E5] p-6 text-center" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm font-medium text-[#111111] mb-2">Delete your account?</p>
                <p className="text-xs text-[#6B6B6B] mb-5">This isn't connected to a real deletion yet.</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmOpen(false)} className="flex-1 text-xs font-medium border border-[#E5E5E5] py-2.5 rounded-full hover:border-[#C9A227]/50 transition-colors">Cancel</button>
                  <button onClick={() => setConfirmOpen(false)} className="flex-1 text-xs font-medium bg-red-500 text-white py-2.5 rounded-full hover:opacity-90 transition-all">Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}