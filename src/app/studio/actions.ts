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
  tags: z.string().trim().max(500)
    .transform((raw) => [...new Set(raw.split(/[,，]/).map((name) => name.trim()).filter(Boolean))])
    .pipe(z.array(z.string().max(50, "单个标签最多 50 个字符。"))),
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

export type EntryActionState = { error: string; message?: string; createdId?: string };
export type ActionFeedback = { ok: boolean; message: string };

function writeFailure(operation: string, error: { code?: string }): ActionFeedback {
  return { ok: false, message: error.code === "PGRST116"
    ? "这条数据已不存在或无法访问，请刷新页面查看。"
    : `${operation}失败，请重试。` };
}

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

function refreshEntryPages() {
  revalidatePath("/");
  revalidatePath("/posts/[slug]", "page");
  revalidatePath("/tags");
  revalidatePath("/tags/[tag]", "page");
  revalidatePath("/studio", "layout");
}

function refreshMediaPages() {
  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath("/studio/media");
}

export async function refreshGalleryAfterUpload() {
  await requireOwner();
  refreshMediaPages();
}

async function replaceEntryTags(
  supabase: Awaited<ReturnType<typeof requireOwner>>["supabase"],
  entryId: string,
  names: string[],
): Promise<string | null> {
  const keep: string[] = [];
  if (names.length > 0) {
    const { data, error } = await supabase.from("tags")
      .upsert(names.map((name) => ({ name })), { onConflict: "name" }).select("id");
    if (error) return `保存标签失败：${error.message}`;
    keep.push(...data.map((tag) => tag.id));
    const { error: linkError } = await supabase.from("entry_tags")
      .upsert(keep.map((tagId) => ({ entry_id: entryId, tag_id: tagId })), {
        onConflict: "entry_id,tag_id", ignoreDuplicates: true,
      });
    if (linkError) return `关联标签失败：${linkError.message}`;
  }

  // 新关联写入后再清理旧项，失败时仍可以用同一份表单重试。
  let remove = supabase.from("entry_tags").delete().eq("entry_id", entryId);
  if (keep.length) remove = remove.not("tag_id", "in", `(${keep.join(",")})`);
  const { error } = await remove;
  return error ? `更新标签失败：${error.message}` : null;
}

function entryColumns(entry: z.infer<typeof entrySchema>) {
  return {
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
  };
}

export async function createEntry(
  _previousState: EntryActionState,
  formData: FormData,
): Promise<EntryActionState> {
  if (_previousState.createdId) {
    formData.set("id", _previousState.createdId);
    const state = await updateEntry(_previousState, formData);
    if (!state.error) redirect(`/studio/entries/${_previousState.createdId}?created=1`);
    return { ...state, createdId: _previousState.createdId };
  }
  const { supabase, claims } = await requireOwner();
  const parsed = parseEntry(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "请检查填写内容。" };
  const entry = parsed.data;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("entries")
    .insert({
      ...entryColumns(entry),
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
  refreshEntryPages();
  if (tagError) return { error: `正文已创建。${tagError}，请再次保存。`, createdId: data.id };
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
  if (existingError) return { error: writeFailure("读取记录", existingError).message };

  const { error } = await supabase
    .from("entries")
    .update({
      ...entryColumns(entry),
      published_at:
        entry.status === "published"
          ? existing.published_at ?? new Date().toISOString()
          : existing.published_at,
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id").single();

  if (error) {
    return {
      error: error.code === "23505" ? "这个文章网址已经被使用，请换一个网址名称。" : writeFailure("保存记录", error).message,
    };
  }
  const tagError = await replaceEntryTags(supabase, id, entry.tags);
  refreshEntryPages();
  if (tagError) return { error: `正文已保存。${tagError}，请再次保存。` };
  return { error: "", message: "修改已保存。" };
}

export async function moveEntryToTrash(formData: FormData): Promise<ActionFeedback> {
  const { supabase } = await requireOwner();
  const id = value(formData, "id");
  const { error } = await supabase
    .from("entries")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id).is("deleted_at", null)
    .select("id").single();
  if (error) return writeFailure("移入回收站", error);

  refreshEntryPages();
  redirect("/studio?trashed=1");
}

export async function restoreEntry(formData: FormData): Promise<ActionFeedback> {
  const { supabase } = await requireOwner();
  const id = value(formData, "id");
  const { error } = await supabase.from("entries").update({ deleted_at: null })
    .eq("id", id).not("deleted_at", "is", null).select("id").single();
  if (error) return writeFailure("恢复记录", error);

  refreshEntryPages();
  return { ok: true, message: "记录已恢复，可在「我的记录」中查看。" };
}

export async function permanentlyDeleteEntry(formData: FormData): Promise<ActionFeedback> {
  const { supabase } = await requireOwner();
  const id = value(formData, "id");
  const { error } = await supabase
    .from("entries")
    .delete()
    .eq("id", id)
    .not("deleted_at", "is", null).select("id").single();
  if (error) return writeFailure("永久删除", error);

  refreshEntryPages();
  return { ok: true, message: "记录已永久删除。" };
}

export async function deleteMedia(formData: FormData): Promise<ActionFeedback> {
  const { supabase } = await requireOwner();
  const id = value(formData, "id");

  const { data: media, error: readError } = await supabase
    .from("media")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (readError) return writeFailure("读取文件", readError);

  const { error: storageError } = await supabase.storage
    .from("public-media")
    .remove([media.storage_path]);
  if (storageError) return { ok: false, message: "删除存储文件失败，请重试。" };

  const { error: rowError } = await supabase.from("media").delete().eq("id", id).select("id").single();
  if (rowError) return { ok: false, message: "文件已从存储删除，但未能确认媒体库记录已清除。请刷新媒体库，若记录仍在，可再次删除。" };

  refreshMediaPages();
  return { ok: true, message: "文件已从媒体库删除。" };
}

export async function setMediaPurpose(formData: FormData): Promise<ActionFeedback> {
  const { supabase } = await requireOwner();
  const id = value(formData, "id");
  const purpose = value(formData, "purpose");

  if (purpose !== "gallery" && purpose !== "article") {
    return { ok: false, message: "文件用途不正确，请刷新后重试。" };
  }

  const { error } = await supabase
    .from("media")
    .update({ purpose })
    .eq("id", id).select("id").single();
  if (error) return writeFailure("更改相册状态", error);

  refreshMediaPages();
  return { ok: true, message: purpose === "gallery" ? "已加入公开相册。" : "已移出公开相册，文件仍在媒体库中。" };
}

export async function updateSiteSettings(formData: FormData): Promise<ActionFeedback> {
  const { supabase, claims } = await requireOwner();
  const parsed = settingsSchema.safeParse({
    siteTitle: value(formData, "siteTitle"),
    siteDescription: value(formData, "siteDescription"),
    homeIntro: value(formData, "homeIntro"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "请检查网站设置。" };

  const { error } = await supabase
    .from("site_settings")
    .update({
      site_title: parsed.data.siteTitle,
      site_description: parsed.data.siteDescription,
      home_intro: parsed.data.homeIntro,
      updated_by: claims?.sub,
    })
    .eq("id", true).select("id").single();
  if (error) return writeFailure("保存网站设置", error);

  revalidatePath("/", "layout");
  return { ok: true, message: "网站设置已保存。" };
}

export async function restoreEntryRevision(formData: FormData): Promise<ActionFeedback> {
  const { supabase } = await requireOwner();
  const entryId = value(formData, "entryId");
  const revisionId = Number(value(formData, "revisionId"));
  if (!entryId || !Number.isInteger(revisionId)) return { ok: false, message: "历史版本参数不正确。" };

  const { data, error: readError } = await supabase
    .from("entry_revisions")
    .select("snapshot")
    .eq("id", revisionId)
    .eq("entry_id", entryId)
    .single();
  if (readError) return writeFailure("读取历史版本", readError);

  const parsed = revisionSnapshotSchema.safeParse(data.snapshot);
  if (!parsed.success) return { ok: false, message: "无法识别这个历史版本的数据格式。" };
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
    .eq("id", entryId).is("deleted_at", null).select("id").single();
  if (restoreError) return writeFailure("恢复历史版本", restoreError);

  const tagError = await replaceEntryTags(supabase, entryId, snapshot.tags);
  refreshEntryPages();
  if (tagError) return { ok: false, message: `正文已恢复。${tagError}，请重试。` };
  redirect(`/studio/entries/${entryId}?restored=1`);
}

export async function updateMediaDetails(formData: FormData): Promise<ActionFeedback> {
  const { supabase } = await requireOwner();
  const id = value(formData, "id");
  const caption = value(formData, "caption").trim();
  const location = value(formData, "location").trim();
  const capturedAt = value(formData, "capturedAt");

  if (capturedAt && !z.iso.date().safeParse(capturedAt).success)
    return { ok: false, message: "请填写有效的拍摄日期。" };
  if (caption.length > 500 || location.length > 200)
    return { ok: false, message: "照片说明最多 500 字，地点最多 200 字。" };

  const { error } = await supabase
    .from("media")
    .update({
      caption,
      location,
      captured_at: capturedAt || null,
    })
    .eq("id", id).select("id").single();
  if (error) return writeFailure("保存拍摄信息", error);

  refreshMediaPages();
  return { ok: true, message: "拍摄信息已保存。" };
}

export async function signOut(): Promise<ActionFeedback> {
  const { supabase } = await requireOwner();
  const { error } = await supabase.auth.signOut();
  if (error) {
    // Supabase 清理本机登录后，远端的全局退出仍可能返回错误。
    const { data } = await supabase.auth.getSession();
    if (data.session) return { ok: false, message: "退出失败，请重试。" };
    redirect("/studio/login?logout=local");
  }
  redirect("/studio/login");
}
