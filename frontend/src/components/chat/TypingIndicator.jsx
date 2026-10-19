export function TypingIndicator() {
  return (
    <div className="chat-slide-up flex justify-start mt-3">
      <div className="bg-white border border-[#E5E5E5] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-1" aria-label="Typing">
        {[0, 1, 2].map((i) => (
          <span key={i} className="chat-dot w-1.5 h-1.5 rounded-full bg-[#6B6B6B]" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}