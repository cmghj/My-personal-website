"use client";

import { useEffect, useState } from "react";
import type { Media } from "@/lib/media";

export default function Gallery({ media }: { media: Media[] }) {
  const [zoomed, setZoomed] = useState<string | null>(null);

  // 按 Esc 关闭大图
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="photo-grid">
        {media.map((item) =>
          item.type === "video" ? (
            <figure key={item.src}>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={item.src} controls playsInline preload="metadata" />
            </figure>
          ) : (
            <figure key={item.src}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.name}
                loading="lazy"
                onClick={() => setZoomed(item.src)}
              />
            </figure>
          )
        )}
      </div>

      {zoomed && (
        <div className="lightbox" onClick={() => setZoomed(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomed} alt="" />
        </div>
      )}
    </>
  );
}
