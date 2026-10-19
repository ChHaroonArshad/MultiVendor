const URL_PATTERN = /(https?:\/\/[^\s<]+)/g;

// split() with a capture group puts the URLs at the odd indexes. Rendered as text/anchors by React, so no HTML injection.
export function LinkifiedText({ text, linkClass = "" }) {
  return text.split(URL_PATTERN).map((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={`underline break-all ${linkClass}`}>{part}</a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}