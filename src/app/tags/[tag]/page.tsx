import Link from "next/link";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import PostList from "@/components/PostList";

// 为每个标签预生成一个页面
export async function generateStaticParams() {
  return (await getAllTags()).map(({ tag }) => ({ tag }));
}

export async function generateMetadata(props: PageProps<"/tags/[tag]">) {
  const { tag } = await props.params;
  return { title: `标签：${decodeURIComponent(tag)}` };
}

export default async function TagPage(props: PageProps<"/tags/[tag]">) {
  const { tag } = await props.params;
  const name = decodeURIComponent(tag);
  const posts = await getPostsByTag(name);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/tags"
        className="text-sm text-muted hover:text-ink transition-colors"
      >
        ← 所有标签
      </Link>

      <header className="mb-8 mt-6 border-b border-line pb-7">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Tagged stories</div>
        <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight">{name}</h1>
        <p className="mt-2 text-sm text-muted">共 {posts.length} 篇相关记录</p>
      </header>

      <PostList posts={posts} />
    </div>
  );
}
