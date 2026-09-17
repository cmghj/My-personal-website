import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = { title: "工作台登录" };

export default function StudioLoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center py-8">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="text-sm text-muted transition-colors hover:text-ink">
          ← 返回公开网站
        </Link>
        <span className="text-xs text-muted">管理入口</span>
      </div>
      <div className="studio-card p-7 sm:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent font-serif text-xl font-bold text-white">
          记
        </div>
        <div className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Personal Studio</div>
        <h1 className="mt-2 font-serif text-3xl font-bold">欢迎回来</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          登录后继续整理你的记录、照片和影像。这里不提供公开注册。
        </p>
        <Suspense
          fallback={
            <div className="mt-8 h-48 animate-pulse rounded-xl bg-stone-100" aria-label="正在准备登录表单" />
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
