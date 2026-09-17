import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

export type Media = {
  src: string; // Supabase Storage 中的公开网址
  type: "image" | "video";
  name: string; // 文件名
  caption: string;
  location: string;
  date: string | null;
};

export async function getGalleryMedia(): Promise<Media[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("media")
    .select("public_url,kind,original_name,caption,location,captured_at,created_at")
    .in("kind", ["image", "video"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`读取公开相册失败：${error.message}`);
  }

  const cloudMedia: Media[] = data.map((item): Media => ({
    src: item.public_url,
    type: item.kind === "video" ? "video" : "image",
    name: item.original_name,
    caption: item.caption,
    location: item.location,
    date: item.captured_at ?? item.created_at,
  })).sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
  return cloudMedia;
}
