import Link from "next/link";
import { formatDate, formatEntryKind, tagHref } from "@/lib/entry-format";

export type ArticleContentData = {
  title: string;
  date: string;
  kind: string;
  excerpt: string;
  cover: string;
  location: string;
  mood: string;
  tags: string[];
  /** Sanitized output from renderMarkdown. */
  html: string;
};

export default function ArticleContent({
  post,
  preview = false,
}: {
  post: ArticleContentData;
  preview?: boolean;
}) {
  return (
    <article className="reading-article">
      <header className="reading-header reading-column">
        <div className="reading-meta">
          <span>{formatEntryKind(post.kind)}</span>
          {post.date && <time dateTime={post.date}>{formatDate(post.date)}</time>}
          {post.location && <span>{post.location}</span>}
          {post.mood && <span>心情 · {post.mood}</span>}
        </div>
        <h1>{post.title || "未命名记录"}</h1>
        {post.excerpt && <p className="reading-deck">{post.excerpt}</p>}
      </header>

      {post.cover && (
        <figure className="reading-cover">
          {/* Direct Storage URLs preserve availability of existing uploads. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.cover} alt={post.title ? `${post.title}的封面` : "记录封面"} fetchPriority="high" />
        </figure>
      )}
      {post.html && (
        <div className="entry-prose reading-column" dangerouslySetInnerHTML={{ __html: post.html }} />
      )}
      {post.tags.length > 0 && (
        <footer className="reading-tags reading-column">
          <span>相关标签</span>
          <ul>
            {post.tags.map((tag) => (
              <li key={tag}>
                {preview ? <span>{tag}</span> : <Link href={tagHref(tag)}>{tag}</Link>}
              </li>
            ))}
          </ul>
        </footer>
      )}
    </article>
  );
}
