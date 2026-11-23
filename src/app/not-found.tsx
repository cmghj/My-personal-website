import Link from "next/link";

export default function NotFound() {
  return (
    <section className="reading-column">
      <header className="archive-heading">
        <h1>这里好像走丢了</h1>
        <p>404</p>
      </header>
      <div className="archive-empty">
        <p>你要找的页面不存在，也许它已经被移走，或者链接输错了。</p>
        <Link href="/"><span aria-hidden="true">←</span> 回到首页</Link>
      </div>
    </section>
  );
}
