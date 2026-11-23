"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "./actions";
import FeedbackForm, { FeedbackProvider } from "./FeedbackForm";
import StudioNav from "./StudioNav";

export default function StudioFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 登录页只显示登录表单，不为绘制工作台外框再查询一次身份。
  if (pathname === "/studio/login") return children;

  return (
    <div className="studio-wide">
      <FeedbackProvider key={pathname}>
        <header className="studio-masthead">
          <div className="studio-masthead-top">
            <Link href="/studio" className="studio-brand">
              <span className="studio-brand-mark" aria-hidden="true">记</span>
              生活档案工作台
            </Link>
            <div className="studio-account">
              <Link href="/" target="_blank">
                查看网站 <span aria-hidden="true">↗</span>
              </Link>
              <FeedbackForm action={signOut} label="退出" pendingLabel="退出中…" pageNotice />
            </div>
          </div>
          <StudioNav />
        </header>
        {children}
      </FeedbackProvider>
    </div>
  );
}
