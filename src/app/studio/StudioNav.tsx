"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/studio", label: "记录", exact: true },
  { href: "/studio/entries/new", label: "新建" },
  { href: "/studio/media", label: "媒体库" },
  { href: "/studio/settings", label: "网站设置" },
  { href: "/studio/trash", label: "回收站" },
];

export default function StudioNav() {
  const pathname = usePathname();

  return (
    <nav className="flex min-w-max items-center gap-1" aria-label="工作台导航">
      {links.map((link) => {
        const active =
          link.href === "/studio"
            ? pathname === "/studio" ||
              (pathname.startsWith("/studio/entries/") && pathname !== "/studio/entries/new")
            : link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white"
                : "studio-nav-link"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
