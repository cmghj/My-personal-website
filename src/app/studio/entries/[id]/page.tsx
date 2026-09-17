import { notFound } from "next/navigation";
import EntryForm, { type EditableEntry, type EditorMedia } from "../EntryForm";
import { requireOwner } from "@/lib/studio";

export const metadata = { title: "编辑记录" };

type EntryTagRelation = {
  tags: { name: string } | { name: string }[] | null;
};

function getTagNames(relations: EntryTagRelation[]): string[] {
  return relations.flatMap((relation) => {
    if (!relation.tags) return [];
    if (Array.isArray(relation.tags)) {
      return relation.tags.map((tag) => tag.name);
    }
    return [relation.tags.name];
  });
}

export default async function EditEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; created?: string; restored?: string }>;
}) {
  const [{ id }, query, { supabase }] = await Promise.all([
    params,
    searchParams,
    requireOwner(),
  ]);

  const [{ data, error }, { data: mediaRows }] = await Promise.all([
    supabase
      .from("entries")
      .select(
        "id,title,slug,kind,occurred_at,excerpt,content_markdown,cover_url,location,mood,status,visibility,is_pinned,entry_tags(tags(name))",
      )
      .eq("id", id)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("media")
      .select("id,kind,public_url,original_name")
      .order("created_at", { ascending: false }),
  ]);

  if (error || !data) notFound();

  const tagNames = getTagNames(
    (data.entry_tags ?? []) as unknown as EntryTagRelation[],
  );
  const entry: EditableEntry = {
    id: data.id,
    title: data.title,
    slug: data.slug,
    kind: data.kind,
    occurredAt: data.occurred_at,
    excerpt: data.excerpt,
    content: data.content_markdown,
    coverUrl: data.cover_url,
    location: data.location,
    mood: data.mood,
    tags: tagNames.join("，"),
    status: data.status,
    visibility: data.visibility,
    isPinned: data.is_pinned,
  };
  const media: EditorMedia[] = (mediaRows ?? []).map((item) => ({
    id: item.id,
    kind: item.kind === "video" ? "video" : "image",
    url: item.public_url,
    name: item.original_name,
  }));

  const notice = query.created
    ? "记录已创建。"
    : query.restored
      ? "历史版本已恢复；恢复前的内容也已自动保存为一个新版本。"
    : query.saved
      ? "修改已保存。"
      : undefined;

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Edit entry</div>
        <h1 className="mt-1 font-serif text-3xl font-bold">编辑记录</h1>
        <p className="mt-2 text-sm text-muted">每次修改正文时，数据库也会自动留下一个历史版本。</p>
      </div>
      <EntryForm entry={entry} media={media} notice={notice} />
    </div>
  );
}
