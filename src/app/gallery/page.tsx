import { getGalleryMedia } from "@/lib/media";
import Gallery from "@/components/Gallery";

export const metadata = { title: "相册" };

export default function GalleryPage() {
  const media = getGalleryMedia();

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold tracking-tight mb-3">相册</h1>
      <p className="text-muted mb-8">照片与影像，记录那些想留住的画面。</p>

      {media.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-8 text-center text-muted">
          相册还是空的。
          <br />
          把照片或视频放进 <code>public/photos/</code> 文件夹，这里就会自动显示。
        </div>
      ) : (
        <Gallery media={media} />
      )}
    </div>
  );
}
