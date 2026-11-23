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
      </div>
      <div className="studio-card p-7 sm:p-9">
        <div className="studio-brand-mark" aria-hidden="true">
          记
        </div>
        <h1 className="mt-5 font-serif text-3xl font-bold">登录工作台</h1>
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
