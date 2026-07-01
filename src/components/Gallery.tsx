"use client";

import { useCallback, useEffect, useState } from "react";
import type { Media } from "@/lib/media";

export default function Gallery({ media }: { media: Media[] }) {
  // 当前在灯箱里打开的第几张（null = 关闭）
  const [index, setIndex] = useState<number | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + media.length) % media.length)),
    [media.length]
  );
  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % media.length)),
    [media.length]
  );

  // 键盘：Esc 关闭，← → 翻页
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, close, prev, next]);

  const current = index === null ? null : media[index];

  return (
    <>
      <div className="photo-grid">
        {media.map((item, i) =>
          item.type === "video" ? (
            <figure
              key={item.src}
              className="video-thumb"
              onClick={() => setIndex(i)}
            >
              <video src={`${item.src}#t=0.1`} preload="metadata" muted />
              <span className="play-badge" aria-hidden>
                ▶
              </span>
            </figure>
          ) : (
            <figure key={item.src}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.name}
                loading="lazy"
                onClick={() => setIndex(i)}
              />
            </figure>
          )
        )}
      </div>

      {current && (
        <div className="lightbox" onClick={close}>
          {/* 阻止点击内容区时关闭 */}
          <div
            className="lightbox-stage"
            onClick={(e) => e.stopPropagation()}
          >
            {current.type === "video" ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={current.src} controls autoPlay playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.src} alt={current.name} />
            )}
          </div>

          {media.length > 1 && (
            <>
              <button
                className="lightbox-nav left"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="上一张"
              >
                ‹
              </button>
              <button
                className="lightbox-nav right"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="下一张"
              >
                ›
              </button>
            </>
          )}

          <button className="lightbox-close" onClick={close} aria-label="关闭">
            ✕
          </button>
        </div>
      )}
    </>
  );
}
