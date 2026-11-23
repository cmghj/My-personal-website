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
    <nav className="site-nav site-width" aria-label="网站导航">
      <Link href="/" className="site-brand" aria-label={`${siteTitle}，首页`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/apple-icon.png" width="34" height="34" alt="" />
        <span>{siteTitle}</span>
      </Link>
      <div className="site-links">
        {links.map(({ href, label }) => {
          const exact = pathname === href;
          const inSection = href === "/" ? pathname.startsWith("/posts/") : pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} aria-current={exact ? "page" : inSection ? "location" : undefined}>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
