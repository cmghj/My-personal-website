import { createClient } from "@/lib/supabase/client";

const extensions: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "image/avif": "avif", "video/mp4": "mp4", "video/webm": "webm",
};
type Client = ReturnType<typeof createClient>;

export function prepareMediaUpload(file: File) {
  const extension = extensions[file.type];
  if (!extension) throw new Error(`不支持「${file.name}」的文件格式。`);
  if (file.size > 100 * 1024 * 1024) throw new Error(`「${file.name}」超过 100 MB。`);
  const dot = file.name.lastIndexOf(".");
  const base = (dot > 0 ? file.name.slice(0, dot) : file.name).normalize("NFKC")
    .replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "media";
  return { id: crypto.randomUUID(), file, filename: `${base}.${extension}`, stored: false };
}

export type MediaUpload = ReturnType<typeof prepareMediaUpload>;

export async function openMediaUpload() {
  const client = createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("登录状态已失效，请重新登录。");
  return { client, ownerId: data.user.id };
}

export async function uploadMedia(
  { client, ownerId }: { client: Client; ownerId: string },
  job: MediaUpload,
  purpose: "article" | "gallery",
) {
  const bucket = client.storage.from("public-media");
  const path = `${ownerId}/${job.id}-${job.filename}`;
  const url = bucket.getPublicUrl(path).data.publicUrl;
  if (!job.stored) {
    const { error } = await bucket.upload(path, job.file, {
      contentType: job.file.type, cacheControl: "31536000", upsert: false,
    });
    if (error) {
      // 响应丢失时，之前的上传仍可能成功；这个 UUID 只属于当前文件。
      const existing = await fetch(url, { method: "HEAD", cache: "no-store" }).catch(() => null);
      if (!existing?.ok) throw new Error(`上传「${job.file.name}」失败：${error.message}`);
    }
    job.stored = true;
  }
  const kind: "image" | "video" = job.file.type.startsWith("video/") ? "video" : "image";
  const { error } = await client.from("media").upsert({
    id: job.id, kind, public_url: url, storage_path: path, original_name: job.file.name,
    mime_type: job.file.type, size_bytes: job.file.size, purpose, owner_id: ownerId,
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) {
    // 响应中断时，记录可能已经写入。确认记录不存在后才清理文件。
    const check = await client.from("media").select("id").eq("id", job.id).maybeSingle();
    if (!check.data) {
      if (!check.error && !(await bucket.remove([path])).error) job.stored = false;
      throw new Error(`登记「${job.file.name}」失败：${error.message}`);
    }
  }
  return { id: job.id, kind, url, name: job.file.name };
}
