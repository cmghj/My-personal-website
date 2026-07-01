import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";

export default function Home() {
  const posts = getAllPosts();

  return (
    <div>
      {/* 顶部简介 */}
      <section className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-3">你好 👋</h1>
        <p className="text-stone-600 leading-relaxed">
          这里记录我的生活、照片和一些随手写下的感想。
          欢迎随便逛逛，也欢迎从今天开始，陪我一起慢慢记录。
        </p>
      </section>

      {/* 记录列表 */}
      <section>
        <h2 className="text-sm font-medium text-stone-400 uppercase tracking-wider mb-6">
          最近的记录
        </h2>
        <ul className="space-y-8">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/posts/${post.slug}`} className="group block">
                <time className="text-xs text-stone-400">
                  {formatDate(post.date)}
                </time>
                <h3 className="mt-1 text-xl font-semibold group-hover:text-amber-700 transition-colors">
                  {post.title}
                </h3>
                <p className="mt-1 text-stone-600 leading-relaxed">
                  {post.excerpt}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        {posts.length === 0 && (
          <p className="text-stone-400">
            还没有记录。在 content/posts/ 里新建一个 .md 文件就能发布第一篇。
          </p>
        )}
      </section>
    </div>
  );
}
