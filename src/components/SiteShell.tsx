"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Nav from "@/components/Nav";

export default function SiteShell({
  children,
  siteTitle,
  siteDescription,
}: {
  children: React.ReactNode;
  siteTitle: string;
  siteDescription: string;
}) {
  const pathname = usePathname();
  const isStudio = pathname.startsWith("/studio");

  if (isStudio) {
    return <main className="min-h-screen bg-studio px-4 py-5 sm:px-6 sm:py-8">{children}</main>;
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur-xl">
        <Nav siteTitle={siteTitle} />
      </header>

      <main className="mx-auto min-w-0 w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-16">
        {children}
      </main>

      <footer className="mt-auto border-t border-line/80 bg-card/50">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <div className="font-serif text-base font-semibold text-ink">{siteTitle}</div>
            <div className="mt-1 text-xs">{siteDescription}</div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="mailto:3178005264@qq.com" className="transition-colors hover:text-accent">
              邮箱
            </a>
            <a
              href="https://github.com/cmghj/My-personal-website"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-accent"
            >
              GitHub
            </a>
            <Link href="/about" className="transition-colors hover:text-accent">
              关于
            </Link>
            <span className="text-line-strong">© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
