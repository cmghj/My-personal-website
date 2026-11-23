import Link from "next/link";
import { formatDate } from "@/lib/posts";
import { requireOwner } from "@/lib/studio";

export const metadata = { title: "工作台" };

const modes = {
  draft: "草稿",
  public: "公开",
  unlisted: "仅链接",
  archived: "归档",
  private: "待整理",
};

function getMode(entry: { status: string; visibility: string }): keyof typeof modes {
  if (entry.status === "draft" || entry.status === "archived") return entry.status;
  if (entry.visibility === "unlisted" || entry.visibility === "public") return entry.visibility;
  return "private";
}

export default async function StudioPage({ searchParams }: {
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ supabase }, { view }] = await Promise.all([requireOwner(), searchParams]);
  const { data, error } = await supabase
    .from("entries")
    .select("id,title,occurred_at,status,visibility,updated_at,deleted_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`读取记录失败：${error.message}`);

  const entries = data.filter((entry) => !entry.deleted_at);
  const counts = { all: entries.length, draft: 0, public: 0, unlisted: 0, archived: 0, private: 0 };
  for (const entry of entries) counts[getMode(entry)]++;
  const filters = Object.entries({ all: "全部", ...modes })
    .filter(([key]) => key !== "private" || counts.private > 0);
  const selected = filters.some(([key]) => key === view) ? view : "all";
  const visibleEntries = entries.filter((entry) => selected === "all" || getMode(entry) === selected);
  const deletedCount = data.length - entries.length;

  return (
    <div>
      <div className="studio-page-heading">
        <h1>我的记录</h1>
        <Link href="/studio/entries/new" className="studio-primary-button">
          <span aria-hidden="true">＋</span> 新建记录
        </Link>
      </div>
      <nav className="studio-filters" aria-label="筛选记录">
        {filters.map(([key, label]) => (
          <Link key={key} href={key === "all" ? "/studio" : `/studio?view=${key}`}
            aria-current={selected === key ? "page" : undefined} scroll={false}>
            {label}<span>{counts[key as keyof typeof counts]}</span>
          </Link>
        ))}
      </nav>

      <div className="studio-list-heading">
        <h2>最近更新</h2>
        {deletedCount > 0 && <Link href="/studio/trash">回收站（{deletedCount}）</Link>}
      </div>
      {visibleEntries.length ? (
        <ul className="studio-records">
          {visibleEntries.map((entry) => {
            const mode = getMode(entry);
            return (
              <li key={entry.id}>
                <Link href={`/studio/entries/${entry.id}`} className="studio-record">
                  <div>
                    <span className="studio-record-title">{entry.title}</span>
                    <time dateTime={entry.occurred_at}>{formatDate(entry.occurred_at)}</time>
                  </div>
                  <span className="studio-record-mode" data-mode={mode}>{modes[mode]}</span>
                  <span className="studio-record-arrow" aria-hidden="true">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="studio-empty">
          <h3>{entries.length ? "这个分类里还没有记录" : "还没有记录"}</h3>
          {entries.length ? <Link href="/studio">查看全部记录 →</Link> : <p>点击「新建记录」开始写第一篇。</p>}
        </div>
      )}
    </div>
  );
}
