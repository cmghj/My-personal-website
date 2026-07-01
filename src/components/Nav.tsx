"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "首页" },
  { href: "/gallery", label: "相册" },
  { href: "/tags", label: "标签" },
  { href: "/about", label: "关于" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto max-w-2xl px-6 h-16 flex items-center justify-between">
      <Link href="/" className="font-serif text-lg font-bold tracking-tight">
        我的记录
      </Link>
      <div className="flex gap-4 sm:gap-6 text-sm">
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
                  ? "text-accent font-medium"
                  : "text-muted hover:text-ink transition-colors"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
