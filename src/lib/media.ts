import fs from "node:fs";
import path from "node:path";

// 相册页会自动展示这个文件夹里的所有照片和视频
const mediaDir = path.join(process.cwd(), "public", "photos");

const IMG_EXT = /\.(jpe?g|png|gif|webp|avif|svg)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

export type Media = {
  src: string; // 网页里引用的路径，如 "/photos/sunset.jpg"
  type: "image" | "video";
  name: string; // 文件名
};

// 读取 public/photos/ 里的照片和视频（不含子文件夹）
export function getGalleryMedia(): Media[] {
  if (!fs.existsSync(mediaDir)) return [];
  return fs
    .readdirSync(mediaDir)
    .filter((f) => IMG_EXT.test(f) || VIDEO_EXT.test(f))
    .sort()
    .map((f) => ({
      src: `/photos/${f}`,
      type: VIDEO_EXT.test(f) ? "video" : "image",
      name: f,
    }));
}
