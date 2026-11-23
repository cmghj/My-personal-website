import Image, { type ImageProps } from "next/image";

export default function SupabaseImage({ alt, ...props }: Omit<ImageProps, "loader">) {
  // 当前存储桶提供公开原图，项目未启用 Supabase 图片缩放服务。
  return <Image {...props} alt={alt} unoptimized />;
}
