import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { updatePreferences } from "../../services/accountApi";

import { Toggle, inputClass, labelClass } from "./settingsUi";

// toggles: [{ key, label, description }]   selects: [{ key, label, options: [{ value, label }] }]
// defaults: fallback values for users who never saved this preference
export function PreferencesSection({ toggles, selects = [], defaults }) {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [prefs, setPrefs] = useState(() => {
    const initial = {};
    Object.keys(defaults).forEach((key) => { initial[key] = user?.preferences?.[key] ?? defaults[key]; });
    return initial;
  });
  const [savingKey, setSavingKey] = useState(null);

  const save = async (key, value) => {
    const previous = prefs[key];
    setPrefs((p) => ({ ...p, [key]: value })); // optimistic
    setSavingKey(key);
    try {
      await updatePreferences({ [key]: value });
      showToast("Preference saved");
      try { await refreshUser(); } catch { /* resyncs on next load */ }
    } catch (err) {
      setPrefs((p) => ({ ...p, [key]: previous })); // roll back
      showToast(err.message || "Could not save your preference.", "error");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {toggles.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4 p-4 border border-[#E5E5E5] rounded-2xl bg-white">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#111111]">{item.label}</p>
              {item.description && <p className="text-xs text-[#6B6B6B] mt-0.5">{item.description}</p>}
            </div>
            <Toggle checked={!!prefs[item.key]} disabled={savingKey === item.key} label={item.label} onChange={(value) => save(item.key, value)} />
          </div>
        ))}
      </div>

      {selects.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {selects.map((select) => (
            <div key={select.key}>
              <label htmlFor={`pref-${select.key}`} className={labelClass}>{select.label}</label>
              <select
                id={`pref-${select.key}`}
                value={prefs[select.key]}
                disabled={savingKey === select.key}
                onChange={(e) => save(select.key, e.target.value)}
                className={inputClass(false)}
              >
                {select.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}