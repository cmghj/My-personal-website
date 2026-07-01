import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <div className="font-serif text-6xl font-bold text-accent">404</div>
      <h1 className="mt-4 font-serif text-2xl font-semibold">这里好像走丢了</h1>
      <p className="mt-3 text-muted">
        你要找的页面不存在，也许它已经被移走，或者链接输错了。
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-accent px-6 py-2.5 text-sm text-white transition-colors hover:bg-accent-strong"
      >
        ← 回到首页
      </Link>
    </div>
  );
}
