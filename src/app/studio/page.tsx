import Link from "next/link";
import { formatDate } from "@/lib/posts";
import { requireOwner } from "@/lib/studio";

export const metadata = { title: "工作台" };

function getEntryMode(entry: { status: string; visibility: string }) {
  if (entry.status === "draft") {
    return { label: "草稿", className: "bg-amber-50 text-amber-700" };
  }
  if (entry.status === "archived") {
    return { label: "已归档", className: "bg-stone-100 text-stone-600" };
  }
  if (entry.visibility === "unlisted") {
    return { label: "仅链接可见", className: "bg-sky-50 text-sky-700" };
  }
  if (entry.visibility !== "public") {
    return { label: "待整理", className: "bg-amber-50 text-amber-700" };
  }
  return { label: "公开", className: "bg-emerald-50 text-emerald-700" };
}

export default async function StudioPage() {
  const { supabase } = await requireOwner();
  const { data: allEntries, error } = await supabase
    .from("entries")
    .select("id,slug,title,occurred_at,status,visibility,updated_at,deleted_at")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`读取记录失败：${error.message}`);

  const entries = allEntries.filter((entry) => entry.deleted_at === null);
  const deletedCount = Math.max(allEntries.length - entries.length, 0);
  const publicCount = entries.filter(
    (entry) => entry.status === "published" && entry.visibility === "public",
  ).length;
  const draftCount = entries.filter((entry) => entry.status === "draft").length;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Overview</div>
          <h1 className="mt-1 font-serif text-3xl font-bold">我的记录</h1>
          <p className="mt-2 text-sm text-muted">写作、整理，再决定哪些内容与世界分享。</p>
        </div>
        <Link href="/studio/entries/new" className="studio-primary-button">
          ＋ 新建记录
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="studio-stat">
          <div className="text-sm text-muted">全部记录</div>
          <div className="mt-2 font-serif text-3xl font-bold">{entries.length}</div>
        </div>
        <div className="studio-stat">
          <div className="text-sm text-muted">公开记录</div>
          <div className="mt-2 font-serif text-3xl font-bold">{publicCount}</div>
        </div>
        <div className="studio-stat">
          <div className="text-sm text-muted">草稿</div>
          <div className="mt-2 font-serif text-3xl font-bold">{draftCount}</div>
        </div>
        <Link href="/studio/trash" className="studio-stat block transition-colors hover:border-line-strong">
          <div className="text-sm text-muted">回收站</div>
          <div className="mt-2 font-serif text-3xl font-bold">{deletedCount}</div>
        </Link>
      </div>

      <div className="mt-10 flex items-end justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold">最近更新</h2>
          <p className="mt-1 text-sm text-muted">点击任意一条继续编辑。</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-line p-10 text-center text-muted">
          还没有数据库记录。点击“新建记录”写下第一篇。
        </div>
      ) : (
        <div className="studio-card mt-6 overflow-hidden">
          {entries.map((entry, index) => {
            const mode = getEntryMode(entry);
            return (
              <Link
                key={entry.id}
                href={`/studio/entries/${entry.id}`}
                className={`flex flex-col gap-3 p-5 transition-colors hover:bg-paper/80 sm:flex-row sm:items-center sm:justify-between ${
                  index > 0 ? "border-t border-line" : ""
                }`}
              >
                <div>
                  <div className="font-serif text-lg font-semibold leading-snug">{entry.title}</div>
                  <div className="mt-1.5 text-xs text-muted">
                    {formatDate(entry.occurred_at)} · {entry.slug}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`rounded-full px-2.5 py-1 ${mode.className}`}>
                    {mode.label}
                  </span>
                  <span className="text-accent">编辑 →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
