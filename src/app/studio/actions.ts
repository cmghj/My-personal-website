"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOwner } from "@/lib/studio";

const entrySchema = z.object({
  title: z.string().trim().min(1, "请填写标题").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "请填写网址名称")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "网址名称只能使用小写英文、数字和短横线"),
  kind: z.enum(["article", "note", "photo_story", "video", "year_review"]),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式不正确"),
  excerpt: z.string().trim().max(500),
  content: z.string(),
  coverUrl: z.string().trim().max(2000),
  location: z.string().trim().max(200),
  mood: z.string().trim().max(100),
  tags: z.string().trim().max(500),
  status: z.enum(["draft", "published", "archived"]),
  visibility: z.enum(["public", "unlisted"]),
  isPinned: z.boolean(),
});

const settingsSchema = z.object({
  siteTitle: z.string().trim().min(1, "请填写网站名称").max(60),
  siteDescription: z.string().trim().min(1, "请填写网站简介").max(160),
  homeIntro: z.string().trim().min(1, "请填写首页开场白").max(300),
});

const revisionSnapshotSchema = z.object({
  title: z.string(),
  slug: z.string(),
  kind: z.enum(["article", "note", "photo_story", "video", "year_review"]),
  excerpt: z.string(),
  content_markdown: z.string(),
  occurred_at: z.string(),
  cover_url: z.string(),
  location: z.string(),
  mood: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  visibility: z.enum(["public", "unlisted"]),
  is_pinned: z.boolean(),
  published_at: z.string().nullable(),
  tags: z.array(z.string()).default([]),
});

export type EntryActionState = { error: string };

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function parseEntry(formData: FormData) {
  return entrySchema.safeParse({
    title: value(formData, "title"),
    slug: value(formData, "slug"),
    kind: value(formData, "kind"),
    occurredAt: value(formData, "occurredAt"),
    excerpt: value(formData, "excerpt"),
    content: value(formData, "content"),
    coverUrl: value(formData, "coverUrl"),
    location: value(formData, "location"),
    mood: value(formData, "mood"),
    tags: value(formData, "tags"),
    status: value(formData, "status"),
    visibility: value(formData, "visibility"),
    isPinned: formData.get("isPinned") === "on",
  });
}

async function replaceEntryTags(
  supabase: Awaited<ReturnType<typeof requireOwner>>["supabase"],
  entryId: string,
  rawTags: string,
): Promise<string | null> {
  const names = [...new Set(rawTags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean))];

  const { error: deleteError } = await supabase
    .from("entry_tags")
    .delete()
    .eq("entry_id", entryId);
  if (deleteError) return `更新标签失败：${deleteError.message}`;

  for (const name of names) {
    const { data: tag, error: tagError } = await supabase
      .from("tags")
      .upsert({ name }, { onConflict: "name" })
      .select("id")
      .single();
    if (tagError) return `保存标签失败：${tagError.message}`;

    const { error: relationError } = await supabase
      .from("entry_tags")
      .insert({ entry_id: entryId, tag_id: tag.id });
    if (relationError) return `关联标签失败：${relationError.message}`;
  }

  return null;
}

export async function createEntry(
  _previousState: EntryActionState,
  formData: FormData,
): Promise<EntryActionState> {
  const { supabase, claims } = await requireOwner();
  const parsed = parseEntry(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "请检查填写内容。" };
  const entry = parsed.data;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("entries")
    .insert({
      title: entry.title,
      slug: entry.slug,
      kind: entry.kind,
      occurred_at: entry.occurredAt,
      excerpt: entry.excerpt,
      content_markdown: entry.content,
      cover_url: entry.coverUrl,
      location: entry.location,
      mood: entry.mood,
      status: entry.status,
      visibility: entry.visibility,
      is_pinned: entry.isPinned,
      owner_id: claims?.sub,
      published_at: entry.status === "published" ? now : null,
    })
    .select("id")
    .single();

  if (error) {
    return {
      error: error.code === "23505" ? "这个文章网址已经被使用，请换一个网址名称。" : `创建记录失败：${error.message}`,
    };
  }
  const tagError = await replaceEntryTags(supabase, data.id, entry.tags);
  if (tagError) return { error: tagError };

  revalidatePath("/");
  revalidatePath("/tags");
  redirect(`/studio/entries/${data.id}?created=1`);
}

export async function updateEntry(
  _previousState: EntryActionState,
  formData: FormData,
): Promise<EntryActionState> {
  const { supabase } = await requireOwner();
  const id = value(formData, "id");
  const parsed = parseEntry(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "请检查填写内容。" };
  const entry = parsed.data;

  const { data: existing, error: existingError } = await supabase
    .from("entries")
    .select("published_at")
    .eq("id", id)
    .single();
  if (existingError) return { error: `读取记录失败：${existingError.message}` };

  const { error } = await supabase
    .from("entries")
    .update({
      title: entry.title,
      slug: entry.slug,
      kind: entry.kind,
      occurred_at: entry.occurredAt,
      excerpt: entry.excerpt,
      content_markdown: entry.content,
      cover_url: entry.coverUrl,
      location: entry.location,
      mood: entry.mood,
      status: entry.status,
      visibility: entry.visibility,
      is_pinned: entry.isPinned,
      published_at:
        entry.status === "published"
          ? existing.published_at ?? new Date().toISOString()
          : existing.published_at,
    })
    .eq("id", id);

  if (error) {
    return {
      error: error.code === "23505" ? "这个文章网址已经被使用，请换一个网址名称。" : `保存记录失败：${error.message}`,
    };
  }
  const tagError = await replaceEntryTags(supabase, id, entry.tags);
  if (tagError) return { error: tagError };

  revalidatePath("/");
  revalidatePath("/tags");
  revalidatePath(`/posts/${entry.slug}`);
  revalidatePath("/studio");
  redirect(`/studio/entries/${id}?saved=1`);
}

export async function moveEntryToTrash(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = value(formData, "id");
  const { error } = await supabase
    .from("entries")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`移入回收站失败：${error.message}`);

  revalidatePath("/");
  revalidatePath("/studio");
  redirect("/studio");
}

export async function restoreEntry(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = value(formData, "id");
  const { error } = await supabase.from("entries").update({ deleted_at: null }).eq("id", id);
  if (error) throw new Error(`恢复记录失败：${error.message}`);

  revalidatePath("/");
  revalidatePath("/studio");
  revalidatePath("/studio/trash");
}

export async function permanentlyDeleteEntry(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = value(formData, "id");
  const { error } = await supabase
    .from("entries")
    .delete()
    .eq("id", id)
    .not("deleted_at", "is", null);
  if (error) throw new Error(`永久删除失败：${error.message}`);

  revalidatePath("/");
  revalidatePath("/studio");
  revalidatePath("/studio/trash");
}

export async function deleteMedia(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = value(formData, "id");

  const { data: media, error: readError } = await supabase
    .from("media")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (readError) throw new Error(`读取文件失败：${readError.message}`);

  const { error: storageError } = await supabase.storage
    .from("public-media")
    .remove([media.storage_path]);
  if (storageError) throw new Error(`删除存储文件失败：${storageError.message}`);

  const { error: rowError } = await supabase.from("media").delete().eq("id", id);
  if (rowError) throw new Error(`删除文件记录失败：${rowError.message}`);

  revalidatePath("/gallery");
  revalidatePath("/studio/media");
}

export async function setMediaPurpose(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = value(formData, "id");
  const purpose = value(formData, "purpose");

  if (purpose !== "gallery" && purpose !== "article") {
    throw new Error("文件用途不正确。");
  }

  const { error } = await supabase
    .from("media")
    .update({ purpose })
    .eq("id", id);
  if (error) throw new Error(`更新文件用途失败：${error.message}`);

  revalidatePath("/gallery");
  revalidatePath("/studio/media");
}

export async function updateSiteSettings(formData: FormData) {
  const { supabase, claims } = await requireOwner();
  const parsed = settingsSchema.safeParse({
    siteTitle: value(formData, "siteTitle"),
    siteDescription: value(formData, "siteDescription"),
    homeIntro: value(formData, "homeIntro"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "请检查网站设置。");

  const { error } = await supabase
    .from("site_settings")
    .update({
      site_title: parsed.data.siteTitle,
      site_description: parsed.data.siteDescription,
      home_intro: parsed.data.homeIntro,
      updated_by: claims?.sub,
    })
    .eq("id", true);
  if (error) throw new Error(`保存网站设置失败：${error.message}`);

  revalidatePath("/", "layout");
  redirect("/studio/settings?saved=1");
}

export async function restoreEntryRevision(formData: FormData) {
  const { supabase } = await requireOwner();
  const entryId = value(formData, "entryId");
  const revisionId = Number(value(formData, "revisionId"));
  if (!entryId || !Number.isInteger(revisionId)) throw new Error("历史版本参数不正确。");

  const { data, error: readError } = await supabase
    .from("entry_revisions")
    .select("snapshot")
    .eq("id", revisionId)
    .eq("entry_id", entryId)
    .single();
  if (readError) throw new Error(`读取历史版本失败：${readError.message}`);

  const parsed = revisionSnapshotSchema.safeParse(data.snapshot);
  if (!parsed.success) throw new Error("这个历史版本的数据格式已经无法识别。");
  const snapshot = parsed.data;

  const { error: restoreError } = await supabase
    .from("entries")
    .update({
      title: snapshot.title,
      slug: snapshot.slug,
      kind: snapshot.kind,
      excerpt: snapshot.excerpt,
      content_markdown: snapshot.content_markdown,
      occurred_at: snapshot.occurred_at,
      cover_url: snapshot.cover_url,
      location: snapshot.location,
      mood: snapshot.mood,
      status: snapshot.status,
      visibility: snapshot.visibility,
      is_pinned: snapshot.is_pinned,
      published_at: snapshot.published_at,
    })
    .eq("id", entryId);
  if (restoreError) throw new Error(`恢复历史版本失败：${restoreError.message}`);

  const tagError = await replaceEntryTags(supabase, entryId, snapshot.tags.join("，"));
  if (tagError) throw new Error(tagError);

  revalidatePath("/", "layout");
  revalidatePath("/studio");
  redirect(`/studio/entries/${entryId}?restored=1`);
}

export async function updateMediaDetails(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = value(formData, "id");
  const caption = value(formData, "caption").trim().slice(0, 500);
  const location = value(formData, "location").trim().slice(0, 200);
  const capturedAt = value(formData, "capturedAt");

  if (capturedAt && !/^\d{4}-\d{2}-\d{2}$/.test(capturedAt)) {
    throw new Error("拍摄日期格式不正确。");
  }

  const { error } = await supabase
    .from("media")
    .update({
      caption,
      location,
      captured_at: capturedAt || null,
    })
    .eq("id", id);
  if (error) throw new Error(`保存照片信息失败：${error.message}`);

  revalidatePath("/gallery");
  revalidatePath("/studio/media");
}

export async function signOut() {
  const { supabase } = await requireOwner();
  await supabase.auth.signOut();
  redirect("/studio/login");
}
