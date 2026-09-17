export default function SiteLoading() {
  return (
    <div className="page-loading" role="status" aria-live="polite" aria-label="正在加载页面">
      <div className="loading-line" />
      <div className="loading-block h-8 w-40" />
      <div className="loading-block mt-4 h-4 w-full max-w-xl" />
      <div className="loading-block mt-2 h-4 w-2/3 max-w-md" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="loading-block h-44 rounded-2xl" />
        <div className="loading-block h-44 rounded-2xl" />
      </div>
      <span className="sr-only">正在加载…</span>
    </div>
  );
}
