"use client";

import Link from "next/link";
import {
  useActionState,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useFormStatus } from "react-dom";
import { createEntry, moveEntryToTrash, updateEntry } from "@/app/studio/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_MEDIA_BYTES = 100 * 1024 * 1024;

export type EditableEntry = {
  id?: string;
  title: string;
  slug: string;
  kind: string;
  occurredAt: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  location: string;
  mood: string;
  tags: string;
  status: string;
  visibility: string;
  isPinned: boolean;
};

export type EditorMedia = {
  id: string;
  kind: "image" | "video";
  url: string;
  name: string;
};

type PublishMode = "draft" | "public" | "unlisted" | "archived";
type PickerMode = "content" | "cover" | null;

const publishOptions: Array<{
  value: PublishMode;
  label: string;
  description: string;
}> = [
  { value: "draft", label: "草稿", description: "只在工作台里，留着继续写" },
  { value: "public", label: "公开发布", description: "出现在网站列表里，所有人都能看" },
  { value: "unlisted", label: "仅链接可见", description: "不出现在列表里，拿到链接的人能看" },
  { value: "archived", label: "归档", description: "保留内容，暂时不在网站展示" },
];

function getInitialPublishMode(entry: EditableEntry): PublishMode {
  if (entry.status === "draft") return "draft";
  if (entry.status === "archived") return "archived";
  if (entry.visibility === "unlisted") return "unlisted";
  if (entry.visibility !== "public") return "draft";
  return "public";
}

function getStoredPublishValues(mode: PublishMode) {
  if (mode === "draft") return { status: "draft", visibility: "public" };
  if (mode === "archived") return { status: "archived", visibility: "public" };
  return { status: "published", visibility: mode };
}

function SaveButton({ editing, compact = false }: { editing: boolean; compact?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`studio-primary-button ${compact ? "!px-4 !py-2" : ""}`}
    >
      {pending ? "正在保存…" : editing ? "保存修改" : "创建记录"}
    </button>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function safeFileName(name: string) {
  const extension = name.includes(".") ? `.${name.split(".").pop()?.toLowerCase()}` : "";
  const base = name
    .replace(/\.[^.]+$/, "")
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "media"}${extension}`;
}

export default function EntryForm({
  entry,
  media,
  notice,
}: {
  entry: EditableEntry;
  media: EditorMedia[];
  notice?: string;
}) {
  const editing = Boolean(entry.id);
  const [slug, setSlug] = useState(entry.slug);
  const [slugTouched, setSlugTouched] = useState(editing);
  const [coverUrl, setCoverUrl] = useState(entry.coverUrl);
  const [content, setContent] = useState(entry.content);
  const [publishMode, setPublishMode] = useState<PublishMode>(() => getInitialPublishMode(entry));
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [availableMedia, setAvailableMedia] = useState(media);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [mediaNotice, setMediaNotice] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction] = useActionState(editing ? updateEntry : createEntry, { error: "" });
  const storedPublishValues = getStoredPublishValues(publishMode);

  function chooseMedia(item: EditorMedia, target: Exclude<PickerMode, null>) {
    if (target === "cover") {
      setCoverUrl(item.url);
      setMediaNotice("已选为封面，点击“保存修改”后生效。");
      setPickerMode(null);
      return;
    }

    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? start;
    const title = item.name.replace(/\.[^.]+$/, "") || (item.kind === "video" ? "视频" : "图片");
    const markdown = `\n![${title}](${item.url})\n`;
    const nextContent = `${content.slice(0, start)}${markdown}${content.slice(end)}`;
    const nextCursor = start + markdown.length;

    setContent(nextContent);
    setMediaNotice("已插入正文光标处。编辑框里会显示一行图片标记，保存后文章页会显示成真正的图片或视频。");
    setPickerMode(null);
    requestAnimationFrame(() => {
      contentRef.current?.focus();
      contentRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  }

  async function uploadAndUseMedia(
    event: ChangeEvent<HTMLInputElement>,
    target: Exclude<PickerMode, null>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setMediaError("");
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setMediaError("请选择照片或视频文件。");
      event.target.value = "";
      return;
    }
    if (target === "cover" && !file.type.startsWith("image/")) {
      setMediaError("封面只能使用图片。");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_MEDIA_BYTES) {
      setMediaError("单个文件不能超过 100MB。");
      event.target.value = "";
      return;
    }

    setUploadingMedia(true);
    const supabase = createClient();
    let uploadedPath = "";

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("登录状态已失效，请刷新页面后重新登录。");

      uploadedPath = `${user.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("public-media")
        .upload(uploadedPath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error(`上传失败：${uploadError.message}`);

      const { data: publicFile } = supabase.storage.from("public-media").getPublicUrl(uploadedPath);
      const { data: savedMedia, error: insertError } = await supabase
        .from("media")
        .insert({
          kind: file.type.startsWith("video/") ? "video" : "image",
          storage_path: uploadedPath,
          public_url: publicFile.publicUrl,
          original_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          purpose: "article",
          owner_id: user.id,
        })
        .select("id,kind,public_url,original_name")
        .single();

      if (insertError || !savedMedia) {
        await supabase.storage.from("public-media").remove([uploadedPath]);
        throw new Error(`登记文件失败：${insertError?.message ?? "未知错误"}`);
      }

      const newItem: EditorMedia = {
        id: savedMedia.id,
        kind: savedMedia.kind === "video" ? "video" : "image",
        url: savedMedia.public_url,
        name: savedMedia.original_name,
      };
      setAvailableMedia((current) => [newItem, ...current]);
      chooseMedia(newItem, target);
    } catch (uploadError) {
      setMediaError(uploadError instanceof Error ? uploadError.message : "上传失败，请重试。");
    } finally {
      setUploadingMedia(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  }

  function saveWithShortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form action={formAction}>
      {entry.id && <input type="hidden" name="id" value={entry.id} />}
      <input type="hidden" name="status" value={storedPublishValues.status} />
      <input type="hidden" name="visibility" value={storedPublishValues.visibility} />

      <div className="sticky top-3 z-20 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card/95 px-4 py-3 shadow-[0_12px_35px_rgba(59,50,44,0.08)] backdrop-blur sm:px-5">
        <div className="flex items-center gap-3">
          <Link href="/studio" className="studio-secondary-button !px-3 !py-2">
            ← 返回
          </Link>
          <div className="hidden text-sm text-muted sm:block">
            {editing ? `正在编辑 · ${entry.title}` : "一条新的生活记录"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing && entry.status === "published" && ["public", "unlisted"].includes(entry.visibility) && (
            <Link href={`/posts/${entry.slug}`} target="_blank" className="studio-secondary-button !px-3 !py-2">
              查看公开页 ↗
            </Link>
          )}
          {editing && (
            <Link href={`/studio/entries/${entry.id}/history`} className="studio-secondary-button !px-3 !py-2">
              历史版本
            </Link>
          )}
          <SaveButton editing={editing} compact />
        </div>
      </div>

      {notice && (
        <div role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          ✓ {notice}
        </div>
      )}

      {state.error && (
        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="studio-card overflow-hidden">
          <div className="border-b border-line p-5 sm:p-7">
            <label htmlFor="title" className="studio-label">标题</label>
            <input
              id="title"
              name="title"
              required
              defaultValue={entry.title}
              onChange={(event) => {
                if (!slugTouched) {
                  const generated = slugify(event.target.value);
                  if (generated) setSlug(generated);
                }
              }}
              className="w-full border-0 bg-transparent font-serif text-2xl font-bold leading-tight text-ink outline-none placeholder:text-stone-300 sm:text-3xl"
              placeholder="今天想记下什么？"
            />
          </div>

          <div className="border-b border-line p-5 sm:p-7">
            <label htmlFor="excerpt" className="studio-label">摘要</label>
            <textarea
              id="excerpt"
              name="excerpt"
              defaultValue={entry.excerpt}
              rows={3}
              maxLength={500}
              className="studio-input resize-y"
              placeholder="用一两句话概括这条记录，它会显示在首页。"
            />
          </div>

          <div className="p-5 sm:p-7">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="content" className="studio-label !mb-0">正文</label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMediaError("");
                    setPickerMode("content");
                  }}
                  className="studio-secondary-button !px-3 !py-2 text-xs"
                >
                  ＋ 插入图片或视频
                </button>
                <span className="text-xs text-muted">Ctrl/⌘ + Enter 保存</span>
              </div>
            </div>
            {mediaNotice && (
              <div role="status" className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800">
                ✓ {mediaNotice}
              </div>
            )}
            <textarea
              ref={contentRef}
              id="content"
              name="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={24}
              onKeyDown={saveWithShortcut}
              className="studio-input min-h-[38rem] resize-y !border-0 !bg-paper/60 font-mono text-[0.92rem] leading-8 !shadow-none"
              placeholder={"从这里开始写……\n\n需要图片时，点击上方的“插入图片或视频”。"}
            />
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
              <span><strong className="text-ink">##</strong> 小标题</span>
              <span><strong className="text-ink">**文字**</strong> 加粗</span>
              <span><strong className="text-ink">-</strong> 列表</span>
              <span>图片和视频可从媒体库直接插入</span>
            </div>
          </div>

          <div className="border-t border-line bg-paper/35 p-5 sm:p-7">
            <div className="mb-5">
              <h2 className="font-serif text-lg font-bold">记录信息</h2>
              <p className="mt-1 text-xs text-muted">这些信息属于记录本身，保存后会用于时间线、标签和检索。</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="occurredAt" className="studio-label">发生日期</label>
                <input id="occurredAt" name="occurredAt" type="date" required defaultValue={entry.occurredAt} className="studio-input" />
              </div>
              <div>
                <label htmlFor="kind" className="studio-label">记录类型</label>
                <select id="kind" name="kind" defaultValue={entry.kind} className="studio-input">
                  <option value="article">文章</option>
                  <option value="note">随手记</option>
                  <option value="photo_story">照片故事</option>
                  <option value="video">视频记录</option>
                  <option value="year_review">年度回顾</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="tags" className="studio-label">标签</label>
                <input id="tags" name="tags" defaultValue={entry.tags} className="studio-input" placeholder="生活，摄影，旅行" />
                <p className="mt-1.5 text-xs text-muted">多个标签用逗号分开</p>
              </div>
              <div>
                <label htmlFor="location" className="studio-label">地点</label>
                <input id="location" name="location" defaultValue={entry.location} className="studio-input" placeholder="杭州" />
              </div>
              <div>
                <label htmlFor="mood" className="studio-label">心情</label>
                <input id="mood" name="mood" defaultValue={entry.mood} className="studio-input" placeholder="平静" />
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="studio-card p-5">
            <h2 className="font-serif text-lg font-bold">保存方式</h2>
            <p className="mt-1 text-xs leading-5 text-muted">只选一个结果，不用再组合“状态”和“可见范围”。</p>
            <div className="mt-5 space-y-5">
              <div role="radiogroup" aria-label="保存方式" className="grid grid-cols-2 gap-2">
                {publishOptions.map((option) => {
                  const selected = publishMode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setPublishMode(option.value)}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${
                        selected
                          ? "border-amber-600 bg-amber-50/70 ring-2 ring-amber-700/10"
                          : "border-line bg-white hover:border-line-strong"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-ink">
                        <span
                          aria-hidden="true"
                          className={`h-2.5 w-2.5 rounded-full ${selected ? "bg-amber-700" : "bg-stone-300"}`}
                        />
                        {option.label}
                      </span>
                      <span className="mt-1 block pl-[1.125rem] text-[0.7rem] leading-4 text-muted">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
              <label className={`flex items-start gap-3 rounded-xl bg-paper p-3 text-sm leading-6 ${publishMode === "public" ? "cursor-pointer" : "opacity-55"}`}>
                <input
                  type="checkbox"
                  name="isPinned"
                  defaultChecked={entry.isPinned}
                  disabled={publishMode !== "public"}
                  className="mt-1 h-4 w-4 accent-amber-700"
                />
                <span>
                  <strong className="block font-medium text-ink">首页置顶</strong>
                  <span className="text-xs text-muted">只有“公开发布”时才会生效</span>
                </span>
              </label>
            </div>
          </section>

          <section className="studio-card p-5">
            <h2 className="font-serif text-lg font-bold">封面与网址</h2>
            <p className="mt-1 text-xs leading-5 text-muted">封面显示在文章卡片上；正文图片请用编辑器里的“插入图片或视频”。</p>
            {coverUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-line bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl} alt="当前封面预览" className="aspect-video w-full object-cover" />
              </div>
            )}
            <div className="mt-4 space-y-5">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setMediaError("");
                    setPickerMode("cover");
                  }}
                  className="studio-secondary-button w-full justify-center"
                >
                  {coverUrl ? "更换封面" : "从媒体库选择封面"}
                </button>
                {coverUrl && (
                  <button
                    type="button"
                    onClick={() => setCoverUrl("")}
                    className="mt-2 w-full text-center text-xs text-red-600 hover:text-red-700"
                  >
                    移除封面
                  </button>
                )}
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-muted hover:text-ink">高级：直接粘贴图片网址</summary>
                  <label htmlFor="coverUrl" className="sr-only">封面图片网址</label>
                  <input
                    id="coverUrl"
                    name="coverUrl"
                    value={coverUrl}
                    onChange={(event) => setCoverUrl(event.target.value)}
                    className="studio-input mt-2 text-sm"
                    placeholder="https://…"
                  />
                </details>
              </div>
              <div>
                <label htmlFor="slug" className="studio-label">文章网址</label>
                <div className="flex items-center rounded-xl border border-line bg-white pl-3 focus-within:border-amber-600 focus-within:ring-3 focus-within:ring-amber-700/10">
                  <span className="text-xs text-muted">/posts/</span>
                  <input
                    id="slug"
                    name="slug"
                    required
                    value={slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setSlug(slugify(event.target.value));
                    }}
                    className="min-w-0 flex-1 border-0 bg-transparent px-1 py-3 font-mono text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {editing && (
            <section className="rounded-2xl border border-red-200 bg-red-50/70 p-5">
              <h2 className="font-medium text-red-900">危险操作</h2>
              <p className="mt-1 text-xs leading-5 text-red-700">记录会先进入回收站，之后仍可恢复。</p>
              <button
                type="submit"
                formAction={moveEntryToTrash}
                formNoValidate
                onClick={(event) => {
                  if (!window.confirm("要把这条记录移入回收站吗？公开页面将不再显示它。")) event.preventDefault();
                }}
                className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                移入回收站
              </button>
            </section>
          )}
        </aside>
      </div>

      {pickerMode && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={pickerMode === "cover" ? "选择封面" : "插入图片或视频"}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPickerMode(null);
          }}
        >
          <div className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-serif text-xl font-bold">
                  {pickerMode === "cover" ? "选择一张封面" : "插入图片或视频"}
                </h2>
                <p className="mt-1 text-xs leading-5 text-muted">
                  媒体库保存原文件；选为封面会显示在卡片上，插入正文会显示在文章内容中。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerMode(null)}
                className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-paper hover:text-ink"
              >
                关闭
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto p-5 sm:p-6">
              {mediaError && (
                <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {mediaError}
                </div>
              )}

              <div className="mb-5 rounded-2xl border border-dashed border-amber-300 bg-amber-50/55 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div>
                  <div className="text-sm font-medium text-ink">电脑里有新的文件？</div>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    上传后会保存为文章素材，并立即{pickerMode === "cover" ? "设为封面" : "插入正文"}；不会自动进入公开相册。
                  </p>
                </div>
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept={pickerMode === "cover" ? "image/jpeg,image/png,image/webp,image/gif,image/avif" : "image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm"}
                  onChange={(event) => void uploadAndUseMedia(event, pickerMode)}
                  disabled={uploadingMedia}
                  className="sr-only"
                  id="editor-media-upload"
                />
                <label
                  htmlFor="editor-media-upload"
                  className={`studio-primary-button mt-3 shrink-0 sm:mt-0 ${uploadingMedia ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
                >
                  {uploadingMedia ? "正在上传…" : "上传并立即使用"}
                </label>
              </div>

              {availableMedia.filter((item) => pickerMode === "content" || item.kind === "image").length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line p-10 text-center">
                  <div className="font-serif text-lg font-semibold">媒体库里还没有可用文件</div>
                  <p className="mt-2 text-sm text-muted">先上传照片或视频，再回到这里选择。</p>
                  <Link href="/studio/media" target="_blank" className="studio-primary-button mt-5 inline-flex">
                    打开媒体库上传 ↗
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {availableMedia
                    .filter((item) => pickerMode === "content" || item.kind === "image")
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => chooseMedia(item, pickerMode)}
                        className="group overflow-hidden rounded-xl border border-line bg-white text-left transition hover:border-amber-600 hover:shadow-md"
                      >
                        <span className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-stone-100">
                          {item.kind === "video" ? (
                            <video src={`${item.url}#t=0.1`} muted preload="metadata" className="h-full w-full object-cover" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
                          )}
                        </span>
                        <span className="block truncate px-3 py-2 text-xs font-medium" title={item.name}>
                          {item.name}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line bg-paper/70 px-5 py-3 text-xs text-muted sm:px-6">
              <span>没有想要的文件？</span>
              <Link href="/studio/media" target="_blank" className="font-medium text-accent hover:text-accent-strong">
                去媒体库上传 ↗
              </Link>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
