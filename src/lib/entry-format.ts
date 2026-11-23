const entryKinds: Record<string, string> = {
  article: "文章",
  note: "随手记",
  photo_story: "照片故事",
  video: "视频记录",
  year_review: "年度回顾",
};

export function formatDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return date;
  return `${match[1]}年${Number(match[2])}月${Number(match[3])}日`;
}

export function formatEntryKind(kind: string): string {
  return entryKinds[kind] ?? "记录";
}

// Percent signs are decoded twice by Next's prerender matcher. Browsers
// normalize dot segments before navigation. A query keeps these names intact.
export function tagHref(tag: string): string {
  const name = encodeURIComponent(tag);
  const needsQuery = tag.includes("%") || tag === "." || tag === "..";
  return needsQuery ? `/tags?name=${name}` : `/tags/${name}`;
}
