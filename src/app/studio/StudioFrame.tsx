"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "./actions";
import FormSubmitButton from "./FormSubmitButton";
import StudioNav from "./StudioNav";

export default function StudioFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 登录页只显示登录表单，不为绘制工作台外框再查询一次身份。
  if (pathname === "/studio/login") return children;

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
              <FormSubmitButton
                idleLabel="退出"
                pendingLabel="正在退出…"
                className="studio-secondary-button"
              />
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
