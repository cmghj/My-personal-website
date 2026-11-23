"use client";

import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import EntryPreview from "./EntryPreview";
import { createEntry, moveEntryToTrash, updateEntry, type EntryActionState } from "@/app/studio/actions";
import FormSubmitButton from "@/app/studio/FormSubmitButton";
import { FeedbackMessage, useNavigationNotice } from "@/app/studio/FeedbackForm";
import SupabaseImage from "@/components/SupabaseImage";
import { openMediaUpload, prepareMediaUpload, uploadMedia, type MediaUpload } from "@/lib/upload-media";


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

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
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
  const pickerRef = useRef<HTMLDialogElement>(null);
  const edits = useRef(0);
  const [showFeedback, setShowFeedback] = useState(true);
  const [state, formAction, pending] = useActionState(async (previous: EntryActionState, data: FormData) => {
    const submittedEdits = edits.current;
    let result: EntryActionState;
    try {
      if (data.get("intent") === "trash") {
        const failure = await moveEntryToTrash(data);
        result = { ...previous, error: failure.message };
      } else {
        result = await (editing ? updateEntry : createEntry)(previous, data);
      }
    } catch (error) {
      unstable_rethrow(error);
      result = { ...previous, error: "暂时无法确认操作结果，请检查网络后重试。" };
    }
    setShowFeedback(Boolean(result.error) || submittedEdits === edits.current);
    return result;
  }, { error: "" });
  const initialNotice = useNavigationNotice(notice);
  const message = state.error || state.message || initialNotice;
  const storedPublishValues = getStoredPublishValues(publishMode);
  const saveLabel = editing && publishMode === getInitialPublishMode(entry)
    ? "保存修改"
    : { draft: "保存草稿", public: "发布记录", unlisted: "保存为仅链接", archived: "归档记录" }[publishMode];

  useEffect(() => {
    if (pickerMode && !pickerRef.current?.open) pickerRef.current?.showModal();
  }, [pickerMode]);

  function markEdited() {
    edits.current++;
    setShowFeedback(false);
  }

  function chooseMedia(item: EditorMedia, target: Exclude<PickerMode, null>) {
    markEdited();
    if (target === "cover") {
      setCoverUrl(item.url);
      setMediaNotice("已选为封面。");
      pickerRef.current?.close();
      setPickerMode(null);
      return;
    }

    const textarea = contentRef.current;
    const current = textarea?.value ?? content;
    const start = textarea?.selectionStart ?? current.length;
    const end = textarea?.selectionEnd ?? start;
    const title = item.name.replace(/\.[^.]+$/, "") || (item.kind === "video" ? "视频" : "图片");
    const alt = title.replace(/[\\[\]]/g, "\\$&").replace(/[\r\n]+/g, " ");
    const url = item.url.replace(/[\s<>]/gu, encodeURIComponent).replaceAll("(", "%28").replaceAll(")", "%29");
    const markdown = `\n![${alt}](${url})\n`;
    const nextContent = `${current.slice(0, start)}${markdown}${current.slice(end)}`;
    const nextCursor = start + markdown.length;

    setContent(nextContent);
    setMediaNotice("已插入正文，可在预览中查看。");
    pickerRef.current?.close();
    setPickerMode(null);
    requestAnimationFrame(() => {
      contentRef.current?.focus();
      contentRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  }

  const pendingEditorUpload = useRef<MediaUpload | null>(null);

  async function uploadAndUseMedia(event: ChangeEvent<HTMLInputElement>, target: Exclude<PickerMode, null>) {
    const file = event.target.files?.[0];
    if (!file || uploadingMedia) return;
    const initiatingDialog = pickerRef.current;
    const stillChoosing = () => initiatingDialog?.open && initiatingDialog === pickerRef.current;
    setMediaError("");
    setUploadingMedia(true);
    try {
      if (target === "cover" && !file.type.startsWith("image/")) throw new Error("封面只能使用图片。");
      const previous = pendingEditorUpload.current?.file;
      if (!previous || file.name !== previous.name || file.size !== previous.size || file.lastModified !== previous.lastModified) {
        pendingEditorUpload.current = prepareMediaUpload(file);
      }
      const item = await uploadMedia(await openMediaUpload(), pendingEditorUpload.current!, "article");
      pendingEditorUpload.current = null;
      setAvailableMedia(items => [item, ...items.filter(existing => existing.id !== item.id)]);
      if (stillChoosing()) chooseMedia(item, target);
      else setMediaNotice(`「${item.name}」已上传，可从媒体库选择。`);
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : "上传失败，请重新选择文件重试。";
      if (stillChoosing()) setMediaError(message);
      else setMediaNotice(message);
    } finally {
      setUploadingMedia(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  }

  function saveWithShortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (!pending) event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form action={formAction} className="studio-editor" onReset={(event) => event.preventDefault()} onChange={markEdited}>
      {entry.id && <input type="hidden" name="id" value={entry.id} />}
      <input type="hidden" name="status" value={storedPublishValues.status} />
      <input type="hidden" name="visibility" value={storedPublishValues.visibility} />

      <div className="studio-editor-toolbar">
        <div className="studio-editor-heading">
          <h1>{editing ? "编辑记录" : "新建记录"}</h1>
          <span>{publishOptions.find((option) => option.value === publishMode)?.label}</span>
        </div>
        <div className="studio-editor-actions">
          <EntryPreview />
          <FormSubmitButton name="intent" value="" idleLabel={saveLabel} pendingLabel="保存中…" className="studio-primary-button" />
        </div>
        {!pending && showFeedback && message && <FeedbackMessage feedback={{ ok: !state.error, message }} />}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="studio-card studio-writing">
          <div className="border-b border-line p-5 sm:p-7">
            <label htmlFor="title" className="studio-label">标题</label>
            <textarea
              id="title"
              name="title"
              required
              maxLength={200}
              rows={1}
              defaultValue={entry.title}
              onChange={(event) => {
                const input = event.currentTarget;
                if (input.value.includes("\n")) input.value = input.value.replace(/\s*\n\s*/g, " ");
                if (!slugTouched) {
                  const generated = slugify(input.value);
                  if (generated) setSlug(generated);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  contentRef.current?.focus();
                }
              }}
              className="studio-title-input"
              placeholder="今天想记下什么？"
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
              </div>
            </div>
            {mediaNotice && (
              <div role="status" className="mb-3 rounded-lg border border-line bg-paper px-4 py-3 text-xs leading-5 text-ink">
                {mediaNotice}
              </div>
            )}
            <textarea
              ref={contentRef}
              id="content"
              name="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={13}
              onKeyDown={saveWithShortcut}
              className="studio-input studio-markdown"
              placeholder="写下此刻，或用 Markdown 排版…"
            />
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
              <span><strong className="text-ink">##</strong> 小标题</span>
              <span><strong className="text-ink">**文字**</strong> 加粗</span>
              <span><strong className="text-ink">-</strong> 列表</span>
              <span>Ctrl / ⌘ + Enter 保存</span>
            </div>
          </div>

          <div className="border-t border-line bg-paper/35 p-5 sm:p-7">
            <h2 className="mb-5 font-serif text-lg font-bold">记录信息</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="excerpt" className="studio-label">摘要</label>
                <textarea id="excerpt" name="excerpt" defaultValue={entry.excerpt} rows={2} maxLength={500}
                  className="studio-input resize-y" placeholder="用一两句话介绍这篇记录" />
              </div>
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
            <div className="mt-4 space-y-4">
              <fieldset className="studio-publish-modes">
                <legend className="sr-only">保存方式</legend>
                {publishOptions.map((option) => (
                  <label key={option.value}>
                    <input type="radio" name="publishMode" value={option.value} checked={publishMode === option.value}
                      onChange={() => setPublishMode(option.value)} />
                    {option.label}
                  </label>
                ))}
              </fieldset>
              <p className="text-xs text-muted">{publishOptions.find((option) => option.value === publishMode)?.description}</p>
              <label className={`flex items-start gap-3 border-t border-line pt-3 text-sm leading-6 ${publishMode === "public" ? "cursor-pointer" : "text-muted"}`}>
                <input
                  type="checkbox"
                  name="isPinned"
                  defaultChecked={entry.isPinned}
                  disabled={publishMode !== "public"}
                  className="mt-1 h-4 w-4 accent-accent"
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
                    onClick={() => { setCoverUrl(""); markEdited(); }}
                    className="mt-2 w-full text-center text-xs text-red-600 hover:text-red-700"
                  >
                    移除封面
                  </button>
                )}
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-muted hover:text-ink">粘贴封面网址</summary>
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
                <div className="flex items-center rounded-lg border border-line bg-white pl-3 focus-within:border-accent">
                  <span className="text-xs text-muted">/posts/</span>
                  <input
                    id="slug"
                    name="slug"
                    required
                    maxLength={120}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    title="请使用小写英文字母、数字和短横线"
                    value={slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setSlug(event.target.value.toLowerCase());
                    }}
                    className="min-w-0 flex-1 border-0 bg-transparent px-1 py-3 font-mono text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {editing && (
            <div className="studio-editor-links">
              <Link href={`/studio/entries/${entry.id}/history`}>历史版本</Link>
              {entry.status === "published" && ["public", "unlisted"].includes(entry.visibility) && (
                <Link href={`/posts/${entry.slug}`} target="_blank">查看公开页 ↗</Link>
              )}
              <FormSubmitButton
                idleLabel="移入回收站"
                pendingLabel="正在移动…"
                name="intent"
                value="trash"
                formNoValidate
                onClick={(event) => {
                  if (!window.confirm("要把这条记录移入回收站吗？公开页面将不再显示它。")) event.preventDefault();
                }}
                className="text-red-700"
              />
            </div>
          )}
        </aside>
      </div>

      {pickerMode && (
        <dialog
          ref={pickerRef}
          className="studio-picker"
          aria-label={pickerMode === "cover" ? "选择封面" : "插入图片或视频"}
          onClose={(event) => {
            if (pickerRef.current === event.currentTarget) setPickerMode(null);
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) pickerRef.current?.close();
          }}
        >
          <div className="bg-card">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-serif text-xl font-bold">
                  {pickerMode === "cover" ? "选择一张封面" : "插入图片或视频"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => pickerRef.current?.close()}
                className="studio-secondary-button"
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

              <div className="mb-5 rounded-lg border border-dashed border-line-strong bg-paper p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div>
                  <div className="text-sm font-medium text-ink">上传新素材</div>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    新文件将存入媒体库，并{pickerMode === "cover" ? "设为封面" : "插入正文"}。
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
                  <p className="mt-2 text-sm text-muted">可通过上方按钮上传文件。</p>
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
                        className="group overflow-hidden rounded-lg border border-line bg-white text-left transition hover:border-accent"
                      >
                        <span className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-stone-100">
                          {item.kind === "video" ? (
                            <video src={`${item.url}#t=0.1`} muted preload="metadata" className="h-full w-full object-cover" />
                          ) : (
                            <SupabaseImage
                              src={item.url}
                              alt=""
                              fill
                              sizes="(min-width: 1024px) 13rem, (min-width: 640px) 28vw, 45vw"
                              className="object-cover transition-transform group-hover:scale-[1.03]"
                            />
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

          </div>
        </dialog>
      )}
    </form>
  );
}
