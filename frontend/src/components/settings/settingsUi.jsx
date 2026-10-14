import { useState } from "react";

export const labelClass = "block text-xs font-medium text-[#6B6B6B] mb-1.5";

export const inputClass = (hasError) =>
  `w-full px-4 py-2.5 rounded-full border bg-[#FAFAFA] text-sm text-[#111111] focus:outline-none focus:ring-2 focus:bg-white transition-all ${
    hasError ? "border-red-400 focus:ring-red-100" : "border-[#E5E5E5] focus:border-[#C9A227] focus:ring-[#C9A227]/15"
  }`;

export function FieldError({ message }) {
  return message ? <p className="mt-1.5 ml-1 text-xs text-red-500">{message}</p> : null;
}

export function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full transition-colors duration-200 relative shrink-0 disabled:opacity-60 ${checked ? "bg-[#C9A227]" : "bg-[#E5E5E5]"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${checked ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

export function PasswordField({ id, label, error, registration, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          {...registration}
          className={`${inputClass(!!error)} pr-14`}
        />
        <button type="button" onClick={() => setVisible((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B] hover:text-[#111111]">
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      <FieldError message={error?.message} />
    </div>
  );
}