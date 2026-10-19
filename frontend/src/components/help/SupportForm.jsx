import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../hooks/useAuth";
import { Spinner } from "../ui/Spinner";
import { FieldError, inputClass, labelClass, textareaClass } from "../settings/settingsUi";
import { submitSupportRequest } from "../../services/reportApi";
import { SUPPORT_CATEGORIES } from "../../data/reportOptions";
import { SUPPORT_RESPONSE_TIME } from "../../data/helpContent";

const FORM_FIELDS = ["category", "message", "name", "email"];

// UX only: the backend repeats every rule.
const baseSchema = z.object({
  category: z.string().min(1, "Please choose a topic."),
  message: z.string().trim().min(20, "Please describe the problem in at least 20 characters.").max(2000, "Message must be under 2000 characters."),
});
const guestSchema = baseSchema.extend({
  name: z.string().trim().min(2, "Please enter your name.").max(80, "Name is too long."),
  email: z.string().trim().email("Please enter a valid email address.").max(255, "Email is too long."),
});

function SupportFormInner({ isGuest, user }) {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register, handleSubmit, reset, setError, watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isGuest ? guestSchema : baseSchema),
    defaultValues: { category: "", message: "", name: "", email: "" },
  });
  const messageLength = watch("message")?.length || 0;

  const onSubmit = async (values) => {
    setServerError("");
    const body = { category: values.category, message: values.message };
    if (isGuest) {
      body.name = values.name;
      body.email = values.email;
    }
    try {
      await submitSupportRequest(body);
      setSent(true);
    } catch (err) {
      let mapped = false;
      err.fieldErrors?.forEach(({ field, message }) => {
        if (FORM_FIELDS.includes(field)) {
          setError(field, { type: "server", message });
          mapped = true;
        }
      });
      if (!mapped) setServerError(err.message || "Could not send your message. Please try again.");
    }
  };

  if (sent) {
    return (
      <div className="text-center py-10 animate-pop-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline className="check-draw" points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-xl font-serif text-[#111111] mb-1">Message sent</p>
        <p className="text-sm text-[#6B6B6B] mb-6">
          We'll reply to {isGuest ? "the email you gave us" : user.email}
          {SUPPORT_RESPONSE_TIME ? `, usually within ${SUPPORT_RESPONSE_TIME}` : ""}.
        </p>
        <button onClick={() => { reset(); setSent(false); }} className="text-sm font-medium border border-[#E5E5E5] px-6 py-2.5 rounded-full hover:border-[#C9A227]/50 transition-colors">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && <div role="alert" className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm">{serverError}</div>}

      {!isGuest && (
        <p className="text-xs text-[#6B6B6B] bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl px-4 py-2.5">
          Sending as <span className="text-[#111111] font-medium">{user.name}</span> ({user.email})
        </p>
      )}

      {isGuest && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="support-name" className={labelClass}>Your name</label>
            <input id="support-name" autoComplete="name" {...register("name")} className={inputClass(!!errors.name)} />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <label htmlFor="support-email" className={labelClass}>Email address</label>
            <input id="support-email" type="email" autoComplete="email" {...register("email")} className={inputClass(!!errors.email)} />
            <FieldError message={errors.email?.message} />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="support-category" className={labelClass}>What do you need help with?</label>
        <select id="support-category" {...register("category")} className={inputClass(!!errors.category)}>
          <option value="">Choose a topic</option>
          {SUPPORT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <FieldError message={errors.category?.message} />
      </div>

      <div>
        <label htmlFor="support-message" className={labelClass}>Message</label>
        <textarea id="support-message" rows={5} placeholder="Tell us what happened. Include your order ID if it is about an order." {...register("message")} className={textareaClass(!!errors.message)} />
        <div className="flex justify-between mt-1">
          <FieldError message={errors.message?.message} />
          <p className="text-[11px] text-[#B0B0B0] ml-auto mr-1">{messageLength}/2000</p>
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full bg-[#111111] text-white py-3 rounded-full text-sm font-medium hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2">
        {isSubmitting && <Spinner size={14} />}
        {isSubmitting ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}

// Waits for the session check, then picks the guest or member form (keyed so it remounts cleanly).
export function SupportForm() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="py-16 flex justify-center"><Spinner size={18} className="text-[#6B6B6B]" /></div>;
  }
  return <SupportFormInner key={user ? "member" : "guest"} isGuest={!user} user={user} />;
}