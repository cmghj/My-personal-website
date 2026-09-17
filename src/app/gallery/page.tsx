import { getGalleryMedia } from "@/lib/media";
import Gallery from "@/components/Gallery";

export const metadata = { title: "相册" };

export default async function GalleryPage() {
  const media = await getGalleryMedia();

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-10 border-b border-line pb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Moments</div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-4xl font-bold tracking-tight">相册</h1>
            <p className="mt-3 text-muted">按时间展开照片与影像，也可以按类型和地点慢慢寻找。</p>
          </div>
          <div className="text-sm text-muted">{media.length} 个瞬间</div>
        </div>
      </header>

      {media.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-card/50 p-12 text-center">
          <div className="font-serif text-xl font-semibold">相册还是空的</div>
          <p className="mt-2 text-sm text-muted">新的照片和视频会被收藏在这里。</p>
        </div>
      ) : (
        <Gallery media={media} />
      )}
    </div>
  );
}
