import { useEffect, useRef, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { EmojiPicker } from "./EmojiPicker";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_MB } from "../../utils/chatUtils";

export function MessageComposer({
  disabled, disabledReason, quickReplies, pendingContext, onClearContext, onSend, onTyping,
  editing, onSubmitEdit, onCancelEdit,
}) {
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const typingRef = useRef({ active: false, lastSent: 0, timer: null });

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  // entering edit mode loads the message into the box
  useEffect(() => {
    if (!editing) return;
    setText(editing.text);
    setImage(null);
    setEmojiOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [editing]);

  const stopTyping = () => {
    const t = typingRef.current;
    clearTimeout(t.timer);
    if (t.active) { t.active = false; onTyping?.(false); }
  };

  const signalTyping = () => {
    if (editing) return;
    const t = typingRef.current;
    const now = Date.now();
    if (!t.active || now - t.lastSent > 3000) { t.active = true; t.lastSent = now; onTyping?.(true); }
    clearTimeout(t.timer);
    t.timer = setTimeout(() => { t.active = false; onTyping?.(false); }, 2000);
  };

  useEffect(() => () => clearTimeout(typingRef.current.timer), []);

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { showToast("Only JPG, PNG or WEBP images can be sent.", "error"); return; }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) { showToast(`Images must be under ${MAX_IMAGE_MB}MB.`, "error"); return; }
    if (image) URL.revokeObjectURL(image.previewUrl);
    setImage({ file, previewUrl: URL.createObjectURL(file) });
  };

  const removeImage = () => {
    if (image) URL.revokeObjectURL(image.previewUrl);
    setImage(null);
  };

  const insertEmoji = (emoji) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    setText((t) => `${t.slice(0, start)}${emoji}${t.slice(end)}`);
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(start + emoji.length, start + emoji.length); });
  };

  const cancelEdit = () => { setText(""); onCancelEdit?.(); };

  const submit = () => {
    const value = text.trim();
    if (editing) {
      if (!value && editing.type === "text") return;
      onSubmitEdit(value);
      setText("");
      return;
    }
    if ((!value && !image) || disabled) return;
    stopTyping();
    onSend({ text: value, image, context: pendingContext });
    setText("");
    setImage(null);
    setEmojiOpen(false);
    onClearContext?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && editing) { cancelEdit(); return; }
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); }
  };

  if (disabled) {
    return (
      <div className="px-4 py-4 border-t border-[#E5E5E5] bg-[#FAFAFA] text-center">
        <p className="text-xs text-[#6B6B6B]">{disabledReason}</p>
      </div>
    );
  }

  const canSend = editing ? Boolean(text.trim() || editing.type === "image") : Boolean(text.trim() || image);

  return (
    <div className="border-t border-[#E5E5E5] bg-white px-3 sm:px-4 py-3">
      {editing && (
        <div className="chat-slide-up flex items-center gap-2.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-2xl px-3 py-2 mb-2">
          <span className="text-base">✏️</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] uppercase tracking-wide text-[#6B6B6B]">Editing message</span>
            <span className="block text-xs text-[#111111] truncate">{editing.text}</span>
          </span>
          <button type="button" onClick={cancelEdit} aria-label="Cancel edit" className="text-xs text-[#6B6B6B] hover:text-red-500">✕</button>
        </div>
      )}

      {!editing && pendingContext && (
        <div className="chat-slide-up flex items-center gap-2.5 bg-[#FBF6E9] border border-[#C9A227]/30 rounded-2xl px-3 py-2 mb-2">
          {pendingContext.image ? <img src={pendingContext.image} alt="" className="w-9 h-9 rounded-lg object-cover" /> : <span className="text-lg">{pendingContext.kind === "order" ? "📦" : "🛍️"}</span>}
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] uppercase tracking-wide text-[#8a6f14]">Asking about</span>
            <span className="block text-xs font-medium text-[#111111] truncate">{pendingContext.title}</span>
          </span>
          <button type="button" onClick={onClearContext} aria-label="Remove" className="text-xs text-[#6B6B6B] hover:text-red-500">✕</button>
        </div>
      )}

      {!editing && image && (
        <div className="chat-slide-up relative inline-block mb-2">
          <img src={image.previewUrl} alt="To send" className="h-20 w-20 rounded-xl object-cover border border-[#E5E5E5]" />
          <button type="button" onClick={removeImage} aria-label="Remove image" className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#111111] text-white text-xs flex items-center justify-center shadow">✕</button>
        </div>
      )}

      {!editing && !text && !image && quickReplies?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto chat-scroll pb-2 -mx-1 px-1">
          {quickReplies.map((reply) => (
            <button key={reply} type="button" onClick={() => { setText(reply); textareaRef.current?.focus(); }} className="shrink-0 text-[11px] border border-[#E5E5E5] text-[#6B6B6B] rounded-full px-3 py-1.5 hover:border-[#C9A227]/60 hover:text-[#111111] hover:-translate-y-0.5 transition-all">
              {reply}
            </button>
          ))}
        </div>
      )}

      <div className="relative flex items-end gap-1.5 border border-[#E5E5E5] rounded-3xl bg-[#FAFAFA] pl-2 pr-1.5 py-1.5 focus-within:border-[#C9A227] focus-within:ring-2 focus-within:ring-[#C9A227]/15 focus-within:bg-white transition-all">
        {emojiOpen && <EmojiPicker onPick={insertEmoji} onClose={() => setEmojiOpen(false)} anchorRef={emojiButtonRef} />}

        <button ref={emojiButtonRef} type="button" onClick={() => setEmojiOpen((v) => !v)} aria-label="Emoji" className="w-9 h-9 shrink-0 rounded-full text-lg hover:bg-[#F0F0F0] transition-colors">🙂</button>

        {!editing && (
          <label className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#F0F0F0] hover:text-[#111111] cursor-pointer transition-colors" aria-label="Attach image">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            <input type="file" accept={ALLOWED_IMAGE_TYPES.join(",")} onChange={pickImage} className="hidden" />
          </label>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          maxLength={2000}
          onChange={(e) => { setText(e.target.value); signalTyping(); }}
          onKeyDown={handleKeyDown}
          placeholder={editing ? "Edit your message..." : "Type a message..."}
          className="flex-1 resize-none bg-transparent outline-none text-sm text-[#111111] placeholder:text-[#B0B0B0] py-2.5 max-h-32"
        />

        {text.length > 1800 && <span className="self-center text-[10px] text-[#B0B0B0]">{2000 - text.length}</span>}

        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label={editing ? "Save edit" : "Send message"}
          className="w-10 h-10 shrink-0 rounded-full bg-[#111111] text-white flex items-center justify-center transition-all duration-200 enabled:hover:scale-105 enabled:active:scale-90 disabled:opacity-30"
        >
          {editing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}