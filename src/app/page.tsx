import { getAllPosts } from "@/lib/posts";
import PostList from "@/components/PostList";
import { getSiteSettings } from "@/lib/settings";

export default async function Home() {
  const [posts, settings] = await Promise.all([getAllPosts(), getSiteSettings()]);

  return (
    <div className="mx-auto max-w-4xl">
      <section className="relative mb-16 overflow-hidden rounded-[2rem] border border-line bg-card px-6 py-10 shadow-[0_22px_70px_rgba(59,50,44,0.06)] sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-amber-100/50 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Personal archive · 个人生活档案
          </div>
          <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            把日子过成故事，<br className="hidden sm:block" />
            也把故事留给时间。
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-muted sm:text-lg">
            {settings.homeIntro}
          </p>
          <div className="mt-8 flex items-center gap-3 text-xs text-muted">
            <span className="h-px w-10 bg-line-strong" />
            <span>已留下 {posts.length} 篇公开记录</span>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Latest stories
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">最近的记录</h2>
          </div>
          <div className="hidden text-sm text-muted sm:block">从近到远，慢慢翻阅</div>
        </div>
        <PostList posts={posts} />
      </section>
    </div>
  );
}
