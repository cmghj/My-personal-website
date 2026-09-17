"use client";

import Image, { type ImageLoaderProps, type ImageProps } from "next/image";

function supabaseImageLoader({ src, width, quality }: ImageLoaderProps) {
  const url = new URL(src);
  const objectPrefix = "/storage/v1/object/public/";

  if (url.hostname.endsWith(".supabase.co") && url.pathname.startsWith(objectPrefix)) {
    url.pathname = url.pathname.replace(objectPrefix, "/storage/v1/render/image/public/");
    url.searchParams.set("width", String(width));
    url.searchParams.set("quality", String(quality ?? 75));
    url.searchParams.set("resize", "cover");
  }

  return url.toString();
}

export default function SupabaseImage({ alt, ...props }: Omit<ImageProps, "loader">) {
  return <Image loader={supabaseImageLoader} alt={alt} {...props} />;
}
