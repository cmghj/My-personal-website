import Link from "next/link";
import { formatDate, formatEntryKind } from "@/lib/entry-format";
import type { PostMeta } from "@/lib/posts";

export default function PostList({
  posts,
  heading: Heading = "h3",
}: {
  posts: PostMeta[];
  heading?: "h2" | "h3";
}) {
  if (!posts.length) {
    return <p className="archive-empty">这里还没有公开记录。</p>;
  }

  return (
    <ul className="archive-entries">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link href={`/posts/${post.slug}`} className="archive-entry">
            <div className="archive-entry-copy">
              <div className="archive-entry-meta">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span>{formatEntryKind(post.kind)}</span>
                {post.location && <span>{post.location}</span>}
              </div>
              <Heading>{post.title}</Heading>
              {post.excerpt && <p>{post.excerpt}</p>}
              {post.tags.length > 0 && (
                <div className="archive-entry-tags">{post.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
              )}
            </div>
            {post.cover && (
              <div className="archive-entry-thumbnail">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.cover} alt="" loading="lazy" decoding="async" />
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
