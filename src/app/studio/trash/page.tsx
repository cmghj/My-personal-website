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
      <div className="studio-page-heading">
        <h1>回收站</h1>
        <span className="text-sm text-muted">{entries.length} 条记录</span>
      </div>

      {entries.length === 0 ? (
        <div className="studio-card p-12 text-center">
          <div className="font-serif text-xl font-semibold">回收站是空的</div>
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
