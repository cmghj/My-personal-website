import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllPosts,
  getPost,
  getAdjacentPosts,
  formatDate,
  formatEntryKind,
} from "@/lib/posts";

// 构建时为每篇记录预生成静态页面（速度快、利于分享）
export async function generateStaticParams() {
  return (await getAllPosts()).map((post) => ({ slug: post.slug }));
}

// 浏览器标签标题 + 分享预览卡片（Open Graph）
export async function generateMetadata(props: PageProps<"/posts/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) return { title: "未找到" };

  // 分享卡片的图：只有真实照片(jpg/png/webp)才用作分享图；
  // SVG 等格式很多平台（微信/Twitter）不渲染，改用默认 PNG 分享图。
  const isRaster = /\.(png|jpe?g|webp)$/i.test(post.cover);
  const image = isRaster ? post.cover : "/og-default.png";
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [image],
    },
  };
}

export default async function PostPage(props: PageProps<"/posts/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) notFound();

  const { newer, older } = await getAdjacentPosts(slug);

  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href="/"
        className="text-sm text-muted hover:text-ink transition-colors"
      >
        ← 返回首页
      </Link>

      <header className="mb-10 mt-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold tracking-[0.1em] text-accent">
          <span>{formatEntryKind(post.kind)}</span>
          <time>{formatDate(post.date)}</time>
          {post.location && <span>⌖ {post.location}</span>}
          {post.mood && <span>心情 · {post.mood}</span>}
        </div>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          {post.title}
        </h1>
        {post.excerpt && <p className="mt-5 text-lg leading-8 text-muted">{post.excerpt}</p>}
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
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
        {post.cover && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-line shadow-[0_18px_55px_rgba(59,50,44,0.08)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover}
              alt={post.title}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}
      </header>

      {/* Markdown 正文转成的 HTML（照片、视频都在这里） */}
      <div className="prose border-t border-line pt-8" dangerouslySetInnerHTML={{ __html: post.html }} />

      {/* 上一篇 / 下一篇 */}
      {(newer || older) && (
        <nav className="mt-14 grid grid-cols-2 gap-4 border-t border-line pt-8">
          <div>
            {older && (
              <Link href={`/posts/${older.slug}`} className="group block">
                <div className="text-xs text-muted">← 更早的一篇</div>
                <div className="mt-1 font-serif font-medium group-hover:text-accent transition-colors">
                  {older.title}
                </div>
              </Link>
            )}
          </div>
          <div className="text-right">
            {newer && (
              <Link href={`/posts/${newer.slug}`} className="group block">
                <div className="text-xs text-muted">更新的一篇 →</div>
                <div className="mt-1 font-serif font-medium group-hover:text-accent transition-colors">
                  {newer.title}
                </div>
              </Link>
            )}
          </div>
        </nav>
      )}
    </article>
  );
}
