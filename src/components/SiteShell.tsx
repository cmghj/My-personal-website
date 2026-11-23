"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Nav from "./Nav";

export default function SiteShell({ children, siteTitle, siteDescription }: {
  children: React.ReactNode;
  siteTitle: string;
  siteDescription: string;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/studio")) {
    return <main className="min-h-screen bg-studio px-4 py-4 sm:px-8 sm:py-7">{children}</main>;
  }

  return (
    <>
      <a className="skip-content" href="#main-content">跳到正文</a>
      <header className="site-header"><Nav siteTitle={siteTitle} /></header>
      <main id="main-content" tabIndex={-1} className="site-width site-main">{children}</main>
      <footer className="site-footer">
        <div className="site-width footer-inner">
          <div>
            <p className="footer-name">{siteTitle}</p>
            <p className="footer-description">{siteDescription}</p>
          </div>
          <div className="footer-links">
            <Link href="/about">关于</Link>
            <a href="mailto:3178005264@qq.com">邮箱</a>
            <a href="https://github.com/cmghj/My-personal-website" target="_blank" rel="noreferrer">GitHub</a>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
