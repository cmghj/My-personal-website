"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Media } from "@/lib/media";
import SupabaseImage from "@/components/SupabaseImage";

type KindFilter = "all" | "image" | "video";

function monthKey(date: string | null) {
  if (!date) return "undated";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "undated";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  if (key === "undated") return "早期收录";
  const [year, month] = key.split("-");
  return `${year} 年 ${Number(month)} 月`;
}

function formatMediaDate(date: string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

export default function Gallery({ media }: { media: Media[] }) {
  const [kind, setKind] = useState<KindFilter>("all");
  const [location, setLocation] = useState("all");
  const [index, setIndex] = useState<number | null>(null);

  const locations = useMemo(
    () => [...new Set(media.map((item) => item.location).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN")),
    [media],
  );
  const filteredMedia = useMemo(
    () =>
      media.filter(
        (item) =>
          (kind === "all" || item.type === kind) &&
          (location === "all" || item.location === location),
      ),
    [kind, location, media],
  );
  const groups = useMemo(() => {
    const grouped = new Map<string, Array<{ item: Media; index: number }>>();
    filteredMedia.forEach((item, itemIndex) => {
      const key = monthKey(item.date);
      const group = grouped.get(key) ?? [];
      group.push({ item, index: itemIndex });
      grouped.set(key, group);
    });
    return [...grouped.entries()];
  }, [filteredMedia]);

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + filteredMedia.length) % filteredMedia.length)),
    [filteredMedia.length]
  );
  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % filteredMedia.length)),
    [filteredMedia.length]
  );

  // 键盘：Esc 关闭，← → 翻页
  useEffect(() => {
    if (index === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [index, close, prev, next]);

  const current = index === null ? null : filteredMedia[index];

  function chooseKind(nextKind: KindFilter) {
    setKind(nextKind);
    setIndex(null);
  }

  function chooseLocation(nextLocation: string) {
    setLocation(nextLocation);
    setIndex(null);
  }

  return (
    <>
      <div className="mb-10 flex flex-col gap-4 rounded-2xl border border-line bg-card/65 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="媒体类型">
          {([
            ["all", `全部 ${media.length}`],
            ["image", `照片 ${media.filter((item) => item.type === "image").length}`],
            ["video", `视频 ${media.filter((item) => item.type === "video").length}`],
          ] as Array<[KindFilter, string]>).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => chooseKind(value)}
              aria-pressed={kind === value}
              className={kind === value ? "rounded-full bg-ink px-4 py-2 text-sm text-white" : "rounded-full border border-line bg-white px-4 py-2 text-sm text-muted transition hover:border-line-strong hover:text-ink"}
            >
              {label}
            </button>
          ))}
        </div>

        {locations.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-muted">
            <span>地点</span>
            <select
              value={location}
              onChange={(event) => chooseLocation(event.target.value)}
              className="rounded-xl border border-line bg-white px-3 py-2 text-ink outline-none focus:border-amber-600"
            >
              <option value="all">全部地点</option>
              {locations.map((itemLocation) => (
                <option key={itemLocation} value={itemLocation}>{itemLocation}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {filteredMedia.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          这个筛选条件下还没有内容。
        </div>
      ) : (
        <div className="space-y-12">
          {groups.map(([key, items]) => (
            <section key={key}>
              <div className="mb-5 flex items-center gap-4">
                <h2 className="shrink-0 font-serif text-2xl font-bold">{monthLabel(key)}</h2>
                <div className="h-px flex-1 bg-line" />
                <span className="shrink-0 text-xs text-muted">{items.length} 个瞬间</span>
              </div>
              <div className="photo-grid">
                {items.map(({ item, index: itemIndex }) => (
                  <figure key={item.src} className={item.type === "video" ? "video-thumb" : undefined}>
                    <button
                      type="button"
                      className="relative block aspect-[4/3] w-full overflow-hidden bg-stone-100"
                      onClick={() => setIndex(itemIndex)}
                      aria-label={item.type === "video" ? `播放 ${item.name}` : `查看大图：${item.name}`}
                    >
                      {item.type === "video" ? (
                        <>
                          <video src={`${item.src}#t=0.1`} preload="metadata" muted />
                          <span className="play-badge" aria-hidden>▶</span>
                        </>
                      ) : (
                        <SupabaseImage
                          src={item.src}
                          alt={item.caption || item.name}
                          fill
                          sizes="(min-width: 900px) 20rem, (min-width: 640px) 45vw, 90vw"
                          className="object-cover"
                        />
                      )}
                    </button>
                    <figcaption className="border-t border-line px-4 py-3">
                      <div className="line-clamp-2 text-sm font-medium leading-6 text-ink">
                        {item.caption || item.name.replace(/\.[^.]+$/, "")}
                      </div>
                      {(item.location || item.date) && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                          {item.location && <span>⌖ {item.location}</span>}
                          {item.date && <span>{formatMediaDate(item.date)}</span>}
                        </div>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {current && (
        <div className="lightbox" onClick={close} role="dialog" aria-modal="true" aria-label="媒体预览">
          {/* 阻止点击内容区时关闭 */}
          <div
            className="lightbox-stage"
            onClick={(e) => e.stopPropagation()}
          >
            {current.type === "video" ? (
              <video src={current.src} controls autoPlay playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.src} alt={current.name} />
            )}
          </div>

          {filteredMedia.length > 1 && (
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
          <div className="absolute bottom-4 left-1/2 w-[min(42rem,75vw)] -translate-x-1/2 text-center text-sm text-white/85">
            <div className="truncate font-medium">{current.caption || current.name}</div>
            <div className="mt-1 text-xs text-white/60">
              {[current.location, formatMediaDate(current.date)].filter(Boolean).join(" · ")}
              {(current.location || current.date) && " · "}
              {index! + 1}/{filteredMedia.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
