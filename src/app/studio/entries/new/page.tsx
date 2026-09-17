import EntryForm, { type EditableEntry, type EditorMedia } from "../EntryForm";
import { requireOwner } from "@/lib/studio";

export const metadata = { title: "新建记录" };

function todayInChina() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function NewEntryPage() {
  const today = todayInChina();
  const baseSlug = `note-${today.replaceAll("-", "")}`;
  const { supabase } = await requireOwner();
  const [{ data: sameDayEntries }, { data: mediaRows }] = await Promise.all([
    supabase
      .from("entries")
      .select("slug")
      .like("slug", `${baseSlug}%`),
    supabase
      .from("media")
      .select("id,kind,public_url,original_name")
      .order("created_at", { ascending: false }),
  ]);
  const suffix = sameDayEntries?.length ? `-${sameDayEntries.length + 1}` : "";
  const entry: EditableEntry = {
    title: "",
    slug: `${baseSlug}${suffix}`,
    kind: "note",
    occurredAt: today,
    excerpt: "",
    content: "",
    coverUrl: "",
    location: "",
    mood: "",
    tags: "",
    status: "draft",
    visibility: "public",
    isPinned: false,
  };
  const media: EditorMedia[] = (mediaRows ?? []).map((item) => ({
    id: item.id,
    kind: item.kind === "video" ? "video" : "image",
    url: item.public_url,
    name: item.original_name,
  }));

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">New entry</div>
        <h1 className="mt-1 font-serif text-3xl font-bold">新建记录</h1>
        <p className="mt-2 text-sm text-muted">先安心写下来，默认保存为草稿，不会出现在公开网站。</p>
      </div>
      <EntryForm entry={entry} media={media} />
    </div>
  );
}
