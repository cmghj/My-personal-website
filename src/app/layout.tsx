import type { Metadata } from "next";
import Nav from "@/components/Nav";
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
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <header className="border-b border-line bg-card/80 backdrop-blur sticky top-0 z-10">
          <Nav />
        </header>

        <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-12">
          {children}
        </main>

        <footer className="border-t border-line py-8 text-center text-sm text-muted">
          © {new Date().getFullYear()} · 用心记录每一天
        </footer>
      </body>
    </html>
  );
}
