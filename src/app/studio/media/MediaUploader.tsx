"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { openMediaUpload, prepareMediaUpload, uploadMedia, type MediaUpload } from "@/lib/upload-media";
import { refreshGalleryAfterUpload } from "../actions";

export default function MediaUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const pending = useRef<MediaUpload[]>([]);
  const busy = useRef(false);
  const [remaining, setRemaining] = useState(0);

  async function uploadFiles(files?: File[]) {
    if (busy.current || (files && (!files.length || pending.current.length))) return;
    busy.current = true;
    setUploading(true);
    setMessage("");
    setError("");
    let completed = 0;
    try {
      if (files) pending.current = files.map(prepareMediaUpload);
      const total = pending.current.length;
      const session = await openMediaUpload();
      while (pending.current.length) {
        setMessage(`正在上传第 ${completed + 1} / ${total} 个文件…`);
        await uploadMedia(session, pending.current[0], "gallery");
        pending.current.shift();
        completed++;
      }
      setMessage(`已上传 ${completed} 个文件，可在公开相册查看。`);
    } catch (failure) {
      setMessage(completed ? `已上传 ${completed} 个文件。` : "");
      setError(failure instanceof Error ? failure.message : "上传失败，请重试。");
    } finally {
      if (completed) {
        try {
          await refreshGalleryAfterUpload();
        } catch {
          setMessage(`已上传 ${completed} 个文件。页面刷新失败，请稍后刷新。`);
        }
      }
      setRemaining(pending.current.length);
      setUploading(false);
      busy.current = false;
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
      className="studio-dropzone"
      data-dragging={dragging || undefined}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm"
        onChange={uploadFromInput}
        disabled={uploading || remaining > 0}
        className="sr-only"
        id="media-upload"
      />
      <div>
        <h2 className="font-serif text-lg font-semibold">上传到公开相册</h2>
        <p className="mt-1 text-xs leading-5 text-muted">可拖入照片或视频，单个文件最大 100 MB。</p>
      </div>
      {remaining === 0 ? <label htmlFor="media-upload" className="studio-primary-button">
        {uploading ? "正在上传…" : "选择文件"}
      </label> : (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="studio-primary-button" disabled={uploading} onClick={() => void uploadFiles()}>重试剩余 {remaining} 个</button>
          <button type="button" className="studio-secondary-button" disabled={uploading} onClick={() => { pending.current = []; setRemaining(0); setError(""); setMessage(""); }}>取消剩余上传</button>
        </div>
      )}
      {message && <p role="status" className="text-sm text-emerald-700">✓ {message}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
