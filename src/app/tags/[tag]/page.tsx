import Link from "next/link";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import PostList from "@/components/PostList";

// 为每个标签预生成一个页面
export function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata(props: PageProps<"/tags/[tag]">) {
  const { tag } = await props.params;
  return { title: `标签：${decodeURIComponent(tag)}` };
}

export default async function TagPage(props: PageProps<"/tags/[tag]">) {
  const { tag } = await props.params;
  const name = decodeURIComponent(tag);
  const posts = getPostsByTag(name);

  return (
    <div>
      <Link
        href="/tags"
        className="text-sm text-muted hover:text-ink transition-colors"
      >
        ← 所有标签
      </Link>

      <h1 className="mt-6 mb-8 font-serif text-3xl font-bold tracking-tight">
        <span className="text-muted font-normal text-2xl">标签 · </span>
        {name}
      </h1>

      <PostList posts={posts} />
    </div>
  );
}
