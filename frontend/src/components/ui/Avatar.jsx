// Shows the profile picture when the user has one, otherwise their initial.
export function Avatar({ name, src, size = 32 }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };

  if (src) {
    return <img src={src} alt={name || "User"} style={style} className="rounded-full object-cover border border-[#E5E5E5] shrink-0" />;
  }
  return (
    <div style={style} className="rounded-full bg-[#111111] text-white font-medium flex items-center justify-center shrink-0">
      {initial}
    </div>
  );
}