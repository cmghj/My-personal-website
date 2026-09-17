import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/studio";
import RestoreRevisionButton from "./RestoreRevisionButton";

export const metadata = { title: "历史版本" };

type RevisionSnapshot = {
  title?: string;
  excerpt?: string;
  content_markdown?: string;
  status?: string;
  visibility?: string;
  tags?: string[];
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(snapshot: RevisionSnapshot) {
  if (snapshot.status === "draft") return "草稿";
  if (snapshot.status === "archived") return "归档";
  return snapshot.visibility === "unlisted" ? "仅链接可见" : "公开发布";
}

export default async function EntryHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { supabase }] = await Promise.all([params, requireOwner()]);
  const [{ data: entry }, { data: revisions, error }] = await Promise.all([
    supabase.from("entries").select("id,title").eq("id", id).maybeSingle(),
    supabase
      .from("entry_revisions")
      .select("id,snapshot,snapshot_at")
      .eq("entry_id", id)
      .order("snapshot_at", { ascending: false }),
  ]);

  if (!entry) notFound();
  if (error) throw new Error(`读取历史版本失败：${error.message}`);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <Link href={`/studio/entries/${id}`} className="text-sm text-muted transition-colors hover:text-ink">
          ← 返回编辑
        </Link>
        <div className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Version history</div>
        <h1 className="mt-1 font-serif text-3xl font-bold">历史版本</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {entry.title} · 每次保存修改前，旧内容都会自动留在这里。恢复也可以反悔，因为当前内容会先保存成新版本。
        </p>
      </div>

      {!revisions || revisions.length === 0 ? (
        <div className="studio-card p-12 text-center">
          <div className="font-serif text-xl font-semibold">还没有历史版本</div>
          <p className="mt-2 text-sm text-muted">第一次修改并保存后，这里就会出现记录。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {revisions.map((revision) => {
            const snapshot = (revision.snapshot ?? {}) as RevisionSnapshot;
            const contentLength = snapshot.content_markdown?.trim().length ?? 0;
            return (
              <article key={revision.id} className="studio-card p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <time>{formatTime(revision.snapshot_at)}</time>
                      <span>·</span>
                      <span>{statusLabel(snapshot)}</span>
                      <span>·</span>
                      <span>{contentLength} 字符</span>
                    </div>
                    <h2 className="mt-2 truncate font-serif text-xl font-semibold">{snapshot.title || "无标题版本"}</h2>
                    {snapshot.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{snapshot.excerpt}</p>}
                    {snapshot.tags && snapshot.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {snapshot.tags.map((tag) => <span key={tag} className="tag-chip">{tag}</span>)}
                      </div>
                    )}
                  </div>
                  <RestoreRevisionButton entryId={id} revisionId={revision.id} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
