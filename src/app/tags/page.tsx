import Link from "next/link";
import { getAllTags } from "@/lib/posts";

export const metadata = { title: "标签" };

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold tracking-tight mb-8">标签</h1>

      {tags.length === 0 ? (
        <p className="text-muted">
          还没有标签。在文章的信息头里加一行 <code>tags: [生活, 随笔]</code> 就有了。
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="tag-chip"
            >
              {tag} · {count}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
