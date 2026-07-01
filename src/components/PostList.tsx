import Link from "next/link";
import { formatDate, type PostMeta } from "@/lib/posts";

export default function PostList({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) {
    return (
      <p className="text-muted">
        还没有记录。在 content/posts/ 里新建一个 .md 文件就能发布第一篇。
      </p>
    );
  }

  return (
    <ul className="space-y-8">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link href={`/posts/${post.slug}`} className="group block">
            <time className="text-xs text-muted">{formatDate(post.date)}</time>
            <h3 className="mt-1 font-serif text-xl font-semibold group-hover:text-accent transition-colors">
              {post.title}
            </h3>
            <p className="mt-1 text-muted leading-relaxed">{post.excerpt}</p>
          </Link>
          {post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="tag-chip"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
