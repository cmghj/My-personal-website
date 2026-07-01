import { getAllPosts } from "@/lib/posts";
import PostList from "@/components/PostList";

export default function Home() {
  const posts = getAllPosts();

  return (
    <div>
      {/* 顶部简介 */}
      <section className="mb-14">
        <h1 className="font-serif text-4xl font-bold tracking-tight mb-4">
          你好，欢迎来到我的角落
        </h1>
        <p className="text-muted leading-relaxed text-lg">
          在这里，我慢慢记录生活里的光——一些照片、一些影像，
          和一些想留住的心情。愿你也能在这里，找到片刻的安静。
        </p>
      </section>

      {/* 记录列表 */}
      <section>
        <h2 className="text-xs font-medium text-muted uppercase tracking-widest mb-6">
          最近的记录
        </h2>
        <PostList posts={posts} />
      </section>
    </div>
  );
}
