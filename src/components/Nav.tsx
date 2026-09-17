"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "首页" },
  { href: "/gallery", label: "相册" },
  { href: "/tags", label: "标签" },
  { href: "/about", label: "关于" },
];

export default function Nav({ siteTitle }: { siteTitle: string }) {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-3 sm:h-[4.5rem] sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-0">
      <Link href="/" className="group flex items-center gap-3" aria-label={`${siteTitle}，返回首页`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.png" alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-line transition-transform group-hover:-rotate-3 group-hover:scale-105" />
        <span className="font-serif text-lg font-bold tracking-tight">{siteTitle}</span>
      </Link>
      <div className="flex w-full min-w-0 items-center justify-between gap-1 text-sm sm:w-auto sm:justify-start sm:gap-2">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "rounded-full bg-card px-3 py-2 font-medium text-ink shadow-[inset_0_0_0_1px_var(--color-line)]"
                  : "rounded-full px-3 py-2 text-muted transition-colors hover:bg-card/70 hover:text-ink"
              }
              aria-current={active ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
