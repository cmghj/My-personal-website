"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/studio", label: "记录" },
  { href: "/studio/media", label: "媒体库" },
  { href: "/studio/settings", label: "网站设置" },
  { href: "/studio/trash", label: "回收站" },
];

export default function StudioNav() {
  const pathname = usePathname();

  return (
    <nav className="studio-sections" aria-label="工作台导航">
      {links.map((link) => {
        const active =
          link.href === "/studio"
            ? pathname === "/studio" || pathname.startsWith("/studio/entries/")
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
