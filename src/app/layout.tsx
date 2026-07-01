import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import "./globals.css";

// 网站正式网址（Vercel 部署时自动填入；本地为 localhost）
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "我的记录",
    template: "%s · 我的记录",
  },
  description: "记录生活、照片与影像的个人小站",
  openGraph: {
    title: "我的记录",
    description: "记录生活、照片与影像的个人小站",
    type: "website",
    locale: "zh_CN",
    images: ["/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "我的记录",
    description: "记录生活、照片与影像的个人小站",
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <header className="border-b border-line bg-card/80 backdrop-blur sticky top-0 z-10">
          <Nav />
        </header>

        <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-12">
          {children}
        </main>

        <footer className="border-t border-line py-8">
          <div className="mx-auto max-w-2xl px-6 flex flex-col items-center gap-3 text-sm text-muted">
            {/* 联系方式：把下面链接换成你自己的，或删掉不需要的 */}
            <div className="flex gap-5">
              <a
                href="mailto:你的邮箱@example.com"
                className="hover:text-accent transition-colors"
              >
                邮箱
              </a>
              <a
                href="https://github.com/cmghj/My-personal-website"
                target="_blank"
                rel="noreferrer"
                className="hover:text-accent transition-colors"
              >
                GitHub
              </a>
              <Link href="/about" className="hover:text-accent transition-colors">
                关于
              </Link>
            </div>
            <div>© {new Date().getFullYear()} · 用心记录每一天</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
