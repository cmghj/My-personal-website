"use client";

import { useEffect, useRef, useState } from "react";
import type { Media } from "@/lib/media";

type Kind = "all" | Media["type"];
type Selection = { index: number; trigger: HTMLButtonElement };

const dayFormat = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai", year: "numeric", month: "long", day: "numeric",
});
const monthFormat = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai", year: "numeric", month: "long",
});

function formatDate(value: string | null, format = dayFormat) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : format.format(date);
}

function titleOf(item: Media) {
  return item.caption || item.name.replace(/\.[^.]+$/, "") || (item.type === "video" ? "视频" : "照片");
}

function MediaViewer({ items, selection, close }: {
  items: Media[];
  selection: Selection;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [index, setIndex] = useState(selection.index);
  const total = items.length;
  const activeIndex = Math.min(index, total - 1);
  const item = items[activeIndex];
  const trigger = selection.trigger;

  function step(offset: number) {
    setIndex((previous) => (Math.min(previous, total - 1) + offset + total) % total);
  }

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const previousOverflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = previousOverflow;
      if (trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [trigger]);

  return (
    <dialog
      ref={dialog}
      className="album-viewer"
      aria-label="媒体预览"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onKeyDown={(event) => {
        if (event.target instanceof HTMLVideoElement || event.altKey || event.metaKey || event.ctrlKey) return;
        if (total > 1 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
          event.preventDefault();
          step(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <div className="album-viewer-bar">
        <button type="button" className="album-viewer-close" onClick={close} aria-label="关闭">
          <span aria-hidden="true">×</span> 关闭
        </button>
      </div>
      <div
        className="album-viewer-stage"
        onClick={(event) => { if (event.target === event.currentTarget) close(); }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchStart.current = item.type === "image" && event.touches.length === 1
            ? { x: touch.clientX, y: touch.clientY } : null;
        }}
        onTouchCancel={() => { touchStart.current = null; }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          touchStart.current = null;
          if (!start || total < 2 || event.touches.length || event.changedTouches.length !== 1) return;
          const dx = event.changedTouches[0].clientX - start.x;
          const dy = event.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
        }}
      >
        {item.type === "video" ? (
          <video key={item.src} src={item.src} controls autoPlay playsInline aria-label={titleOf(item)} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.src} alt={item.caption || item.name} />
        )}
      </div>
      <div className="album-viewer-bottom">
        <div className="album-viewer-caption" aria-live="polite">
          <p>{titleOf(item)}</p>
          <small>{[item.location, formatDate(item.date)].filter(Boolean).join("，")}</small>
        </div>
        {total > 1 && (
          <div className="album-viewer-nav">
            <button type="button" aria-label="上一张" onClick={() => step(-1)}>←</button>
            <span>{activeIndex + 1} / {total}</span>
            <button type="button" aria-label="下一张" onClick={() => step(1)}>→</button>
          </div>
        )}
      </div>
    </dialog>
  );
}

export default function Gallery({ media }: { media: Media[] }) {
  const [kind, setKind] = useState<Kind>("all");
  const [place, setPlace] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);

  const photos = media.filter((item) => item.type === "image").length;
  const videos = media.length - photos;
  const hasKindFilter = photos > 0 && videos > 0;
  const places = [...new Set(media.map((item) => item.location).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const hasPlaceFilter = places.length > 1 || (places.length === 1 && media.some((item) => !item.location));
  const activePlace = hasPlaceFilter && places.includes(place) ? place : "";
  const filtered = media.filter((item) =>
    (!hasKindFilter || kind === "all" || item.type === kind) && (!activePlace || item.location === activePlace),
  );
  const single = filtered.length === 1;
  const groups = new Map<string, { item: Media; index: number }[]>();
  filtered.forEach((item, index) => {
    const month = formatDate(item.date, monthFormat) || "日期未记";
    const items = groups.get(month);
    if (items) items.push({ item, index });
    else groups.set(month, [{ item, index }]);
  });

  return (
    <div className="album-page">
      <header className="album-heading">
        <h1>相册</h1>
        {media.length > 0 && (
          <p>{[photos ? `${photos} 张照片` : "", videos ? `${videos} 段视频` : ""].filter(Boolean).join("，")}</p>
        )}
      </header>

      {(hasKindFilter || hasPlaceFilter) && (
        <div className="album-filters">
          {hasKindFilter && (
            <div className="album-kind-filter" role="group" aria-label="媒体类型">
              {([["all", "全部"], ["image", "照片"], ["video", "视频"]] as const).map(([value, label]) => (
                <button type="button" key={value} aria-pressed={kind === value} onClick={() => setKind(value)}>{label}</button>
              ))}
            </div>
          )}
          {hasPlaceFilter && (
            <div className="album-place-filter">
              <label htmlFor="album-location">地点</label>
              <select id="album-location" value={activePlace} onChange={(event) => setPlace(event.target.value)}>
                <option value="">全部地点</option>
                {places.map((location) => <option key={location} value={location}>{location}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="album-empty">
          <p>{media.length ? "这个筛选条件下还没有照片或视频。" : "相册里还没有照片或视频。"}</p>
          {media.length > 0 && <button type="button" onClick={() => { setKind("all"); setPlace(""); }}>清除筛选</button>}
        </div>
      )}

      {[...groups].map(([month, items]) => (
        <section key={month} className={single ? "album-solo" : "album-month"} aria-label={month}>
          {!single && <h2>{month}</h2>}
          <div className="album-grid">
            {items.map(({ item, index }) => (
              <figure key={item.src} className="album-figure">
                <button
                  type="button"
                  className="album-thumb"
                  aria-label={`${item.type === "video" ? "播放" : "查看大图"}：${titleOf(item)}`}
                  onClick={(event) => setSelection({ index, trigger: event.currentTarget })}
                >
                  {item.type === "video" ? (
                    <>
                      <video src={`${item.src}#t=0.1`} preload="metadata" muted playsInline />
                      <span className="album-play" aria-hidden="true">▶</span>
                    </>
                  ) : (
                    // 原图保留自身比例，大小由展图区域约束。
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.src} alt={item.caption || item.name} loading={index === 0 ? "eager" : "lazy"} decoding="async" />
                  )}
                </button>
                <figcaption>
                  <p>{titleOf(item)}</p>
                  <div className="album-figure-meta">
                    {item.location && <span>{item.location}</span>}
                    {item.date && <time dateTime={item.date}>{formatDate(item.date)}</time>}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}

      {selection && filtered.length > 0 && (
        <MediaViewer items={filtered} selection={selection} close={() => setSelection(null)} />
      )}
    </div>
  );
}
