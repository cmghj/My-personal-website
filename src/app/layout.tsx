import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "我的记录",
  description: "记录生活、照片与感想的个人小站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-800">
        <header className="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-10">
          <nav className="mx-auto max-w-2xl px-6 h-16 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg tracking-tight">
              我的记录
            </Link>
            <div className="flex gap-6 text-sm text-stone-500">
              <Link href="/" className="hover:text-stone-900 transition-colors">
                首页
              </Link>
              <Link
                href="/about"
                className="hover:text-stone-900 transition-colors"
              >
                关于
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-12">
          {children}
        </main>

        <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-400">
          © {new Date().getFullYear()} · 用心记录每一天
        </footer>
      </body>
    </html>
  );
}
