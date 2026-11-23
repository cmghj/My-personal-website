export const metadata = { title: "关于" };

export default function AboutPage() {
  return (
    <article className="about-page reading-column">
      <header className="archive-heading"><h1>关于这个小站</h1></header>
      <div className="entry-prose">
        <p>这是一个属于自己的生活档案，也是一处不急着更新、不追赶热闹的个人空间。</p>
        <p>我会把照片、影像和当时的想法放在这里。很多瞬间发生时看起来普通，过一段时间再回头，却常常成为最值得珍藏的部分。</p>
        <blockquote>记录不是为了证明生活多么精彩，只是想让一些真实发生过的日子不被忘记。</blockquote>
        <h2>这里会留下些什么</h2>
        <ul>
          <li>日常里值得记住的小事</li>
          <li>路上遇见的光、风景和声音</li>
          <li>最近在读、在看、在想的东西</li>
          <li>写给未来自己的只言片语</li>
        </ul>
      </div>
    </article>
  );
}
