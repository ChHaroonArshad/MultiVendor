import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "../../context/ToastContext";
import { Spinner } from "../ui/Spinner";
import { changePassword } from "../../services/authApi";
import { PasswordField } from "./settingsUi";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] })
  .refine((d) => d.currentPassword !== d.newPassword, { message: "New password must be different from your current password.", path: ["newPassword"] });

export function SecuritySection() {
  const { showToast } = useToast();
  const [serverError, setServerError] = useState("");

  const {
    register, handleSubmit, reset, setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    setServerError("");
    try {
      await changePassword({ currentPassword, newPassword });
      reset();
      showToast("Password changed. Your other devices were signed out.");
    } catch (err) {
      if (err.message === "Current password is incorrect.") {
        setError("currentPassword", { type: "server", message: err.message });
      } else {
        setServerError(err.message || "Unable to reach the server. Please try again.");
      }
    }
  };

  return (
    <div>
      <p className="text-sm font-medium text-[#111111] mb-1">Change password</p>
      <p className="text-xs text-[#6B6B6B] mb-4">Your other devices will be signed out after you change it.</p>

      {serverError && (
        <div className="mb-4 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm">{serverError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <PasswordField id="currentPassword" label="Current password" autoComplete="current-password" registration={register("currentPassword")} error={errors.currentPassword} />
        <PasswordField id="newPassword" label="New password" autoComplete="new-password" registration={register("newPassword")} error={errors.newPassword} />
        <PasswordField id="confirmPassword" label="Confirm new password" autoComplete="new-password" registration={register("confirmPassword")} error={errors.confirmPassword} />
        <button
          type="submit"
          disabled={isSubmitting}
          className="text-sm font-medium bg-[#111111] text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <Spinner size={13} />}
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}