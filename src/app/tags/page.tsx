import Link from "next/link";
import { getAllTags } from "@/lib/posts";

export const metadata = { title: "标签" };

export default async function TagsPage() {
  const tags = await getAllTags();

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-10 border-b border-line pb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Collections</div>
        <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight">标签</h1>
        <p className="mt-3 text-muted">沿着不同的主题，重新遇见过去的记录。</p>
      </header>

      {tags.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong p-12 text-center text-muted">
          还没有可以浏览的标签。
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="group flex items-center justify-between rounded-2xl border border-line bg-card p-5 shadow-[0_10px_30px_rgba(59,50,44,0.03)] transition-all hover:-translate-y-0.5 hover:border-line-strong"
            >
              <span className="font-serif text-xl font-semibold transition-colors group-hover:text-accent">{tag}</span>
              <span className="rounded-full bg-paper px-2.5 py-1 text-xs text-muted">{count} 篇</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
