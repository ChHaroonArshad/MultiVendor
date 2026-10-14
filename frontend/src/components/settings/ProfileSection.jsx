import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { Avatar } from "../ui/Avatar";
import { Spinner } from "../ui/Spinner";
import { updateProfile, uploadAvatar, removeAvatar } from "../../services/accountApi";

import { FieldError, inputClass, labelClass } from "./settingsUi";

const MAX_AVATAR_MB = 2;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const FORM_FIELDS = ["name", "phone", "dateOfBirth", "gender"];

// UX only: the backend repeats every one of these rules.
const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your full name.")
    .min(2, "Name must be at least 2 characters.")
    .max(50, "Name must be under 50 characters.")
    .regex(/^[^0-9]*$/, "Name cannot contain numbers.")
    .regex(/^[A-Za-z\u00C0-\u017F' -]*$/, "Name can only contain letters, spaces, hyphens, and apostrophes.")
    .regex(/[A-Za-z\u00C0-\u017F]/, "Name must contain at least one letter."),
  phone: z.string().trim().refine((v) => v === "" || /^[0-9+()\-\s]{7,20}$/.test(v), "Enter a valid phone number."),
  dateOfBirth: z.string().refine((v) => v === "" || (!Number.isNaN(Date.parse(v)) && new Date(v) <= new Date()), "Enter a valid date of birth."),
  gender: z.enum(["", "female", "male", "other"]),
});

const toFormValues = (user) => ({
  name: user?.name || "",
  phone: user?.phone || "",
  dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : "",
  gender: user?.gender || "",
});

// `fields` = which extra inputs this role gets: "phone", "dateOfBirth", "gender".
export function ProfileSection({ fields = [] }) {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const {
    register, handleSubmit, reset, setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({ resolver: zodResolver(profileSchema), defaultValues: toFormValues(user) });

  const syncUser = async () => {
    try {
      await refreshUser(); // header, order tables etc. read the user from context
    } catch {
      // the next page load will resync it
    }
  };

  const onSubmit = async (values) => {
    const body = { name: values.name };
    fields.forEach((key) => { body[key] = values[key]; });

    try {
      const res = await updateProfile(body);
      reset(toFormValues(res.data.user));
      showToast("Profile updated");
      await syncUser();
    } catch (err) {
      let mapped = false;
      err.fieldErrors?.forEach(({ field, message }) => {
        if (FORM_FIELDS.includes(field)) {
          setError(field, { type: "server", message });
          mapped = true;
        }
      });
      if (!mapped) showToast(err.message || "Could not update your profile.", "error");
    }
  };

  const handleAvatarSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be chosen again later
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      showToast("Please choose a JPG, PNG or WebP image.", "error");
      return;
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      showToast(`Image must be under ${MAX_AVATAR_MB}MB.`, "error");
      return;
    }

    setAvatarBusy(true);
    try {
      await uploadAvatar(file);
      await syncUser();
      showToast("Profile photo updated");
    } catch (err) {
      showToast(err.message || "Could not upload your photo.", "error");
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarBusy(true);
    try {
      await removeAvatar();
      await syncUser();
      showToast("Profile photo removed");
    } catch (err) {
      showToast(err.message || "Could not remove your photo.", "error");
    } finally {
      setAvatarBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar name={user?.name} src={user?.avatar} size={72} />
          {avatarBusy && (
            <div className="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center">
              <Spinner size={18} className="text-[#111111]" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarBusy}
              className="text-xs font-medium border border-[#E5E5E5] px-4 py-2 rounded-full hover:border-[#C9A227]/50 transition-colors disabled:opacity-50"
            >
              {user?.avatar ? "Change photo" : "Upload photo"}
            </button>
            {user?.avatar && (
              <button type="button" onClick={handleAvatarRemove} disabled={avatarBusy} className="text-xs text-red-500 hover:underline disabled:opacity-50">
                Remove
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#B0B0B0] mt-1.5">JPG, PNG or WebP, up to {MAX_AVATAR_MB}MB.</p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarSelected} className="hidden" />
      </div>

      <div>
        <label htmlFor="profile-name" className={labelClass}>Full name</label>
        <input id="profile-name" autoComplete="name" {...register("name")} className={inputClass(!!errors.name)} />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <label className={labelClass}>Email address</label>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-[#F3F3F3] text-sm text-[#6B6B6B]">
          <span className="truncate">{user?.email}</span>
          {user?.isEmailVerified && (
            <span className="text-[10px] uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full shrink-0">Verified</span>
          )}
        </div>
        <p className="text-[11px] text-[#B0B0B0] mt-1.5">Your email address is linked to your account and cannot currently be changed.</p>
      </div>

      {(fields.includes("phone") || fields.includes("dateOfBirth")) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.includes("phone") && (
            <div>
              <label htmlFor="profile-phone" className={labelClass}>Phone</label>
              <input id="profile-phone" type="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" {...register("phone")} className={inputClass(!!errors.phone)} />
              <FieldError message={errors.phone?.message} />
            </div>
          )}
          {fields.includes("dateOfBirth") && (
            <div>
              <label htmlFor="profile-dob" className={labelClass}>Date of birth</label>
              <input id="profile-dob" type="date" max={new Date().toISOString().slice(0, 10)} {...register("dateOfBirth")} className={inputClass(!!errors.dateOfBirth)} />
              <FieldError message={errors.dateOfBirth?.message} />
            </div>
          )}
        </div>
      )}

      {fields.includes("gender") && (
        <div>
          <label htmlFor="profile-gender" className={labelClass}>Gender</label>
          <select id="profile-gender" {...register("gender")} className={inputClass(!!errors.gender)}>
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
          <FieldError message={errors.gender?.message} />
        </div>
      )}

      <button
        type="submit"
        disabled={!isDirty || isSubmitting}
        className="text-sm font-medium bg-[#111111] text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-2"
      >
        {isSubmitting && <Spinner size={13} />}
        {isSubmitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}