import { ErrorBoundary } from "react-error-boundary";
import { Link, useLocation } from "react-router-dom";

function Fallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-xl font-serif text-[#111111] mb-2">Something went wrong</p>
        <p className="text-sm text-[#6B6B6B] mb-5">This page hit an unexpected problem. You can try again or go back home.</p>
        {import.meta.env.DEV && (
          <pre className="text-left text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 mb-5 overflow-auto max-h-40 whitespace-pre-wrap">
            {error.message}
          </pre>
        )}
        <div className="flex justify-center gap-3">
          <button onClick={resetErrorBoundary} className="text-sm font-medium border border-[#E5E5E5] px-5 py-2.5 rounded-full hover:border-[#C9A227]/50 transition-colors">Try again</button>
          <Link to="/" className="text-sm font-medium bg-[#111111] text-white px-5 py-2.5 rounded-full hover:opacity-90 transition-all">Go home</Link>
        </div>
      </div>
    </div>
  );
}

export function AppErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary FallbackComponent={Fallback} resetKeys={[pathname]} onError={(error) => console.error("Render error:", error)}>
      {children}
    </ErrorBoundary>
  );
}