import Link from "next/link";
import { getStudioAccess } from "@/lib/studio";
import { signOut } from "./actions";
import StudioNav from "./StudioNav";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const access = await getStudioAccess();

  // 登录页也位于 /studio 下；未登录时让登录页本身正常渲染。
  // 其他工作台页面仍会由 Proxy 和 requireOwner 双重保护。
  if (!access.claims) return children;

  if (access.setupError) {
    return (
      <div className="studio-wide py-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-7 text-amber-950">
          <h1 className="font-serif text-2xl font-bold">数据库还差最后一步初始化</h1>
          <p className="mt-3 leading-relaxed">
            登录已经成功，但数据库表和权限函数尚不存在。请先在 Supabase SQL Editor
            运行项目中的首个迁移脚本。
          </p>
          <code className="mt-4 block rounded-lg bg-white/70 p-3 text-sm">
            supabase/migrations/202609160001_initial_archive.sql
          </code>
        </div>
      </div>
    );
  }

  if (!access.isOwner) {
    return (
      <div className="studio-wide py-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-7 text-amber-950">
          <h1 className="font-serif text-2xl font-bold">账号已登录，但尚未授权</h1>
          <p className="mt-3 leading-relaxed">
            当前用户需要被加入数据库的 <code>site_owners</code> 表后才能管理内容。
          </p>
          <p className="mt-3 text-sm">当前用户 ID：</p>
          <code className="mt-1 block break-all rounded-lg bg-white/70 p-3 text-sm">
            {access.claims.sub}
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-wide">
      <header className="studio-card mb-7 overflow-hidden">
        <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <Link href="/studio" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-serif text-lg font-bold text-white">
              记
            </span>
            <span>
              <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent">
                Personal Studio
              </span>
              <span className="mt-0.5 block font-serif text-xl font-bold">生活档案工作台</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="studio-secondary-button">
              查看网站 ↗
            </Link>
            <form action={signOut}>
              <button className="studio-secondary-button">退出</button>
            </form>
          </div>
        </div>
        <div className="overflow-x-auto border-t border-line bg-paper/60 px-3 py-2 sm:px-4">
          <StudioNav />
        </div>
      </header>
      {children}
    </div>
  );
}
