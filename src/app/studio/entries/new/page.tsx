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
  const existingSlugs = new Set(sameDayEntries?.map((row) => row.slug));
  let slug = baseSlug;
  for (let suffix = 2; existingSlugs.has(slug); suffix++) slug = `${baseSlug}-${suffix}`;
  const entry: EditableEntry = {
    title: "",
    slug,
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

  return <EntryForm entry={entry} media={media} />;
}
