"use client";

import { useRef, useState, type MouseEvent } from "react";
import ArticleContent, { type ArticleContentData } from "@/components/ArticleContent";

function publicUrl(value: string, articleUrl: URL) {
  if (!value || /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(value)) return value;
  return new URL(value, articleUrl).href;
}

export default function EntryPreview() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [post, setPost] = useState<ArticleContentData | null>(null);
  const [error, setError] = useState("");

  async function openPreview(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form || !dialog.current) return;
    const data = new FormData(form);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    dialog.current.showModal();
    setError("");
    try {
      const { renderMarkdown } = await import("@/lib/markdown");
      if (!dialog.current?.open) return;
      // Relative links must resolve the same way here and at /posts/[slug].
      const articleUrl = new URL(`/posts/${encodeURIComponent(field("slug") || "preview")}`, window.location.origin);
      const template = document.createElement("template");
      template.innerHTML = renderMarkdown(String(data.get("content") ?? ""));
      for (const attribute of ["src", "href", "poster"]) {
        for (const element of template.content.querySelectorAll(`[${attribute}]`)) {
          const value = element.getAttribute(attribute) ?? "";
          element.setAttribute(attribute, publicUrl(value, articleUrl));
          if (attribute === "href" && !value.startsWith("#")) {
            element.setAttribute("target", "_blank");
            element.setAttribute("rel", "noopener noreferrer");
          }
        }
      }
      setPost({
        title: field("title"),
        date: field("occurredAt"),
        excerpt: field("excerpt"),
        cover: publicUrl(field("coverUrl"), articleUrl),
        kind: field("kind"),
        location: field("location"),
        mood: field("mood"),
        tags: [...new Set(field("tags").split(/[,，]/).map((tag) => tag.trim()).filter(Boolean))],
        html: template.innerHTML,
      });
    } catch {
      setError("预览暂时无法加载，请返回编辑后重试。");
    }
  }

  return (
    <>
      <button type="button" className="studio-secondary-button" aria-haspopup="dialog" onClick={openPreview}>预览</button>
      <dialog ref={dialog} className="studio-preview" aria-labelledby="preview-heading" onClose={() => setPost(null)}>
        <div className="studio-preview-bar">
          <h2 id="preview-heading">文稿预览</h2>
          <button type="button" className="studio-secondary-button" onClick={() => dialog.current?.close()}>
            返回编辑
          </button>
        </div>
        {error ? <p role="alert" className="p-6">{error}</p> : post ? (
          <div className="studio-preview-article"><ArticleContent post={post} preview /></div>
        ) : <p role="status" className="p-6 text-muted">正在排版…</p>}
      </dialog>
    </>
  );
}
