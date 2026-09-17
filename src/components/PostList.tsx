import Link from "next/link";
import { formatDate, formatEntryKind, type PostMeta } from "@/lib/posts";

export default function PostList({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong bg-card/50 px-6 py-14 text-center">
        <div className="font-serif text-xl font-semibold">这里还很安静</div>
        <p className="mt-2 text-sm text-muted">新的公开记录会出现在这里。</p>
      </div>
    );
  }

  return (
    <ul className="space-y-5">
      {posts.map((post) => (
        <li key={post.slug} className="group overflow-hidden rounded-2xl border border-line bg-card shadow-[0_12px_35px_rgba(59,50,44,0.035)] transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_18px_45px_rgba(59,50,44,0.07)]">
          <Link
            href={`/posts/${post.slug}`}
            className={`grid ${post.cover ? "sm:grid-cols-[14rem_1fr]" : ""}`}
          >
            {post.cover && (
              <div className="overflow-hidden bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.cover}
                  alt={post.title}
                  loading="lazy"
                  className="aspect-[16/9] h-full min-h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] sm:aspect-auto"
                />
              </div>
            )}
            <div className="flex min-w-0 flex-col p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-muted">
                <span className="rounded-full bg-paper px-2 py-1 text-accent">{formatEntryKind(post.kind)}</span>
                <time>{formatDate(post.date)}</time>
                {post.location && <span>· {post.location}</span>}
              </div>
              <h3 className="mt-2 font-serif text-xl font-semibold leading-snug transition-colors group-hover:text-accent sm:text-2xl">
                {post.title}
              </h3>
              <p className="mt-3 line-clamp-2 text-sm leading-7 text-muted">{post.excerpt}</p>
              <div className="mt-auto flex items-end justify-between gap-4 pt-5">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-xs text-muted">
                      #{tag}
                    </span>
                  ))}
                </div>
                <span className="shrink-0 text-sm text-accent transition-transform group-hover:translate-x-1">
                  阅读 →
                </span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
