import CopyUrlButton from "./CopyUrlButton";
import DeleteMediaButton from "./DeleteMediaButton";
import MediaUploader from "./MediaUploader";
import { setMediaPurpose, updateMediaDetails } from "@/app/studio/actions";
import { requireOwner } from "@/lib/studio";

export const metadata = { title: "照片与视频" };

function formatSize(bytes: number | null) {
  if (!bytes) return "未知大小";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function StudioMediaPage() {
  const { supabase } = await requireOwner();
  const { data: media, error } = await supabase
    .from("media")
    .select("id,kind,public_url,original_name,size_bytes,purpose,caption,location,captured_at,created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`读取媒体库失败：${error.message}`);

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Media library</div>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-serif text-3xl font-bold">媒体库</h1>
          <span className="text-sm text-muted">{media.length} 个文件</span>
        </div>
        <p className="mt-2 text-sm text-muted">
          这里统一保存原始文件。通过本页上传的文件会进入公开相册；在文章编辑器里直接上传的文件只作为文章素材，不会自动进入相册。
        </p>
      </div>

      <MediaUploader />

      {media.length === 0 ? (
        <div className="studio-card mt-8 p-12 text-center">
          <div className="font-serif text-xl font-semibold">媒体库还是空的</div>
          <p className="mt-2 text-sm text-muted">上传的照片和视频会出现在这里。</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => (
            <article key={item.id} className="studio-card group overflow-hidden">
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-stone-100">
                {item.kind === "video" ? (
                  <video src={`${item.public_url}#t=0.1`} controls preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.public_url} alt={item.original_name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                )}
              </div>
              <div className="p-4">
                <div className="truncate text-sm font-medium" title={item.original_name}>
                  {item.original_name}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>{item.kind === "video" ? "视频" : "图片"} · {formatSize(item.size_bytes)}</span>
                  <span className={item.purpose === "gallery" ? "rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700" : "rounded-full bg-stone-100 px-2 py-0.5 text-stone-600"}>
                    {item.purpose === "gallery" ? "公开相册" : "文章素材"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1">
                  <CopyUrlButton url={item.public_url} />
                  <form action={setMediaPurpose}>
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      type="hidden"
                      name="purpose"
                      value={item.purpose === "gallery" ? "article" : "gallery"}
                    />
                    <button
                      type="submit"
                      className="rounded-lg px-2.5 py-1.5 text-xs text-accent transition-colors hover:bg-amber-50 hover:text-accent-strong"
                    >
                      {item.purpose === "gallery" ? "移出相册" : "加入相册"}
                    </button>
                  </form>
                  <DeleteMediaButton id={item.id} name={item.original_name} />
                </div>
                <details className="mt-3 border-t border-line pt-3">
                  <summary className="cursor-pointer text-xs font-medium text-accent hover:text-accent-strong">
                    编辑拍摄信息
                  </summary>
                  <form action={updateMediaDetails} className="mt-3 space-y-3">
                    <input type="hidden" name="id" value={item.id} />
                    <div>
                      <label htmlFor={`capturedAt-${item.id}`} className="studio-label">拍摄日期</label>
                      <input
                        id={`capturedAt-${item.id}`}
                        name="capturedAt"
                        type="date"
                        defaultValue={item.captured_at?.slice(0, 10) ?? ""}
                        className="studio-input !py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor={`location-${item.id}`} className="studio-label">地点</label>
                      <input
                        id={`location-${item.id}`}
                        name="location"
                        defaultValue={item.location}
                        className="studio-input !py-2 text-sm"
                        placeholder="例如：杭州"
                      />
                    </div>
                    <div>
                      <label htmlFor={`caption-${item.id}`} className="studio-label">照片说明</label>
                      <textarea
                        id={`caption-${item.id}`}
                        name="caption"
                        defaultValue={item.caption}
                        rows={2}
                        className="studio-input resize-y !py-2 text-sm"
                        placeholder="这一刻发生了什么？"
                      />
                    </div>
                    <button type="submit" className="studio-secondary-button w-full justify-center !py-2">
                      保存拍摄信息
                    </button>
                  </form>
                </details>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
