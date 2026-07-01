export const metadata = { title: "关于" };

export default function AboutPage() {
  return (
    <div className="prose">
      <h1>关于我</h1>
      <p>
        这里可以写你自己的介绍——你是谁、喜欢什么、为什么开始记录。
        改这段文字，只需要编辑 <code>src/app/about/page.tsx</code> 这个文件。
      </p>
      <h2>可以聊聊</h2>
      <ul>
        <li>生活里让我开心的小事</li>
        <li>最近在读 / 在看 / 在想的东西</li>
        <li>联系我：把你的邮箱或社交账号放这里</li>
      </ul>
    </div>
  );
}
