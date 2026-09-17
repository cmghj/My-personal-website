"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 100 * 1024 * 1024;

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

export default function MediaUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("登录状态已失效，请刷新页面后重新登录。");

      for (const file of files) {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          throw new Error(`${file.name} 不是支持的照片或视频。`);
        }
        if (file.size > MAX_BYTES) throw new Error(`${file.name} 超过了 100MB。`);

        const path = `${user.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("public-media")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error(`上传 ${file.name} 失败：${uploadError.message}`);

        const { data: publicFile } = supabase.storage.from("public-media").getPublicUrl(path);
        const { error: insertError } = await supabase.from("media").insert({
          kind: file.type.startsWith("video/") ? "video" : "image",
          storage_path: path,
          public_url: publicFile.publicUrl,
          original_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          purpose: "gallery",
          owner_id: user.id,
        });

        if (insertError) {
          await supabase.storage.from("public-media").remove([path]);
          throw new Error(`登记 ${file.name} 失败：${insertError.message}`);
        }
      }

      setMessage(`已上传 ${files.length} 个文件，它们现在会显示在公开相册中。`);
      router.refresh();
    } catch (uploadFailure) {
      setError(uploadFailure instanceof Error ? uploadFailure.message : "上传失败，请重试。");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function uploadFromInput(event: ChangeEvent<HTMLInputElement>) {
    void uploadFiles(Array.from(event.target.files ?? []));
  }

  function dropFiles(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!uploading) void uploadFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={dropFiles}
      className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
        dragging ? "border-accent bg-amber-50" : "border-line-strong bg-card/70"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm"
        onChange={uploadFromInput}
        disabled={uploading}
        className="sr-only"
        id="media-upload"
      />
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-accent">↑</div>
      <div className="font-serif text-lg font-semibold">拖放照片或视频到这里</div>
      <p className="mt-1 text-sm text-muted">或者从电脑中选择文件</p>
      <label htmlFor="media-upload" className="studio-primary-button mt-5">
        {uploading ? "正在上传，请稍候…" : "选择文件"}
      </label>
      <p className="mt-3 text-xs leading-5 text-muted">
        支持 JPG、PNG、WebP、GIF、AVIF、MP4、WebM；单个文件不超过 100MB。上传后默认公开。
      </p>
      {message && <p className="mt-4 text-sm text-emerald-700">✓ {message}</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    </div>
  );
}
