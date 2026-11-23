import { getGalleryMedia } from "@/lib/media";
import Gallery from "@/components/Gallery";
import "./gallery.css";

export const dynamic = "force-dynamic";

export const metadata = { title: "相册" };

export default async function GalleryPage() {
  return <Gallery media={await getGalleryMedia()} />;
}
