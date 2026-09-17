export default function StudioLoading() {
  return (
    <div className="page-loading" role="status" aria-live="polite" aria-label="正在加载工作台">
      <div className="loading-line" />
      <div className="loading-block h-8 w-36" />
      <div className="loading-block mt-3 h-4 w-72 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="loading-block h-28 rounded-2xl" />
        ))}
      </div>
      <div className="loading-block mt-8 h-64 rounded-2xl" />
      <span className="sr-only">正在加载工作台…</span>
    </div>
  );
}
