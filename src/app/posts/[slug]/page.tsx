import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPost, formatDate } from "@/lib/posts";

// 构建时为每篇记录预生成静态页面（速度快、利于分享）
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

// 每篇记录的浏览器标签标题
export async function generateMetadata(props: PageProps<"/posts/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  return { title: post ? post.title : "未找到" };
}

export default async function PostPage(props: PageProps<"/posts/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article>
      <Link
        href="/"
        className="text-sm text-stone-400 hover:text-stone-700 transition-colors"
      >
        ← 返回首页
      </Link>

      <header className="mt-6 mb-8">
        <time className="text-sm text-stone-400">
          {formatDate(post.date)}
        </time>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{post.title}</h1>
      </header>

      {/* Markdown 正文转成的 HTML */}
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </article>
  );
}
