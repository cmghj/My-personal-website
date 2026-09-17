import { formatDate } from "@/lib/posts";
import { requireOwner } from "@/lib/studio";
import TrashActions from "./TrashActions";

export const metadata = { title: "回收站" };

export default async function TrashPage() {
  const { supabase } = await requireOwner();
  const { data: entries, error } = await supabase
    .from("entries")
    .select("id,title,slug,occurred_at,deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) throw new Error(`读取回收站失败：${error.message}`);

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Trash</div>
        <h1 className="mt-1 font-serif text-3xl font-bold">回收站</h1>
        <p className="mt-2 text-sm text-muted">移入回收站的记录不会在公开网站出现，可以恢复或永久删除。</p>
      </div>

      {entries.length === 0 ? (
        <div className="studio-card p-12 text-center">
          <div className="font-serif text-xl font-semibold">回收站是空的</div>
          <p className="mt-2 text-sm text-muted">删除的记录会先来到这里。</p>
        </div>
      ) : (
        <div className="studio-card overflow-hidden">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${index > 0 ? "border-t border-line" : ""}`}
            >
              <div>
                <div className="font-serif text-lg font-semibold">{entry.title}</div>
                <div className="mt-1 text-xs text-muted">{formatDate(entry.occurred_at)} · {entry.slug}</div>
              </div>
              <TrashActions id={entry.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
