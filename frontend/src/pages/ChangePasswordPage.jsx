import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "../components/Navbar";
import { Link } from "react-router-dom";
// import { changePassword } from "../services/authApi";
import { changePassword } from "../services/authApi";
import { useAuth } from "../hooks/useAuth";
import { getHomeForRole } from "../utils/roleUtils";

// inside the component:
const schema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required."),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters.")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
            .regex(/[0-9]/, "Password must contain at least one number."),
        confirmPassword: z.string().min(1, "Please confirm your new password."),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
    })
    .refine((d) => d.currentPassword !== d.newPassword, {
        message: "New password must be different from your current password.",
        path: ["newPassword"],
    });

const FIELDS = [
    { name: "currentPassword", label: "Current password", placeholder: "Enter your current password", autoComplete: "current-password" },
    { name: "newPassword", label: "New password", placeholder: "Create a new password", autoComplete: "new-password" },
    { name: "confirmPassword", label: "Confirm new password", placeholder: "Re-enter your new password", autoComplete: "new-password" },
];

export function ChangePasswordPage() {
    const [visible, setVisible] = useState({});
    const [serverError, setServerError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
const { user } = useAuth();
    const {
        register, handleSubmit, reset,
        formState: { errors },
    } = useForm({ resolver: zodResolver(schema) });

    const onSubmit = async ({ currentPassword, newPassword }) => {
        setServerError("");
        setSuccess(false);
        setLoading(true);
        try {
            await changePassword({ currentPassword, newPassword });
            setSuccess(true);
            reset();
        } catch (err) {
            setServerError(err.message || "Unable to reach the server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#E5E5E5] px-8 py-10 sm:px-12 animate-fade-slide-up">
                    <h1 className="text-3xl font-serif text-[#111111] mb-2">Change password</h1>
                    <p className="text-sm text-[#6B6B6B] mb-6">
                        For your security, other devices will be signed out after you change it.
                    </p>

                    {success && (
                        <div role="status" className="mb-5 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm animate-fade-slide-up">
                            <p className="font-medium">Password changed successfully.</p>
                            <p className="text-xs mt-0.5">
                                Your other devices have been signed out.{" "}
                               <Link to={getHomeForRole(user?.role)} className="underline font-medium">Back to dashboard</Link>
                            </p>
                        </div>
                    )}
                    {serverError && (
                        <div className="mb-5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm animate-fade-slide-up">
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        {FIELDS.map(({ name, label, placeholder, autoComplete }) => (
                            <div key={name} className="mb-4">
                                <label htmlFor={name} className="block text-xs font-medium text-[#6B6B6B] mb-1.5 ml-1">{label}</label>
                                <div className="relative">
                                    <input
                                        id={name}
                                        type={visible[name] ? "text" : "password"}
                                        autoComplete={autoComplete}
                                        placeholder={placeholder}
                                        {...register(name)}
                                        className={`w-full px-4 py-3 pr-12 rounded-full border text-sm text-[#111111] bg-[#FAFAFA] placeholder:text-[#B0B0B0] transition-all duration-200 focus:outline-none focus:ring-2 focus:bg-white ${errors[name] ? "border-red-400 focus:ring-red-100" : "border-[#E5E5E5] focus:border-[#C9A227] focus:ring-[#C9A227]/15"
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setVisible((v) => ({ ...v, [name]: !v[name] }))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B] hover:text-[#111111]"
                                    >
                                        {visible[name] ? "Hide" : "Show"}
                                    </button>
                                </div>
                                {errors[name] && <p className="mt-1.5 ml-1 text-xs text-red-500">{errors[name].message}</p>}
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-[#111111] text-white py-3 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                            {loading ? "Updating..." : "Update password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}