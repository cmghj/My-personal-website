import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleContent from "@/components/ArticleContent";
import { getAdjacentPosts, getPost } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/posts/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) return { title: "未找到" };

  const isRaster = /\.(png|jpe?g|webp)(?:[?#]|$)/i.test(post.cover);
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
    <div className="reading-page">
      <div className="reading-column">
        <Link href="/" className="reading-back"><span aria-hidden="true">←</span> 返回首页</Link>
      </div>
      <ArticleContent post={post} />
      {(newer || older) && (
        <nav className="reading-neighbors reading-column" aria-label="相邻记录">
          {older && (
            <Link href={`/posts/${older.slug}`}>
              <small>← 上一篇</small><span>{older.title}</span>
            </Link>
          )}
          {newer && (
            <Link href={`/posts/${newer.slug}`} className="reading-next">
              <small>下一篇 →</small><span>{newer.title}</span>
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
