import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked, type Tokens } from "marked";

// 所有记录（Markdown 文件）都放在这个文件夹里
const postsDir = path.join(process.cwd(), "content", "posts");

// 让「插入图片」的写法自动识别视频：
//   ![描述](/photos/cat.jpg)   -> 图片
//   ![描述](/videos/walk.mp4)  -> 视频播放器
// 你只需要记住一种写法，放图放视频都一样。
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;
marked.use({
  renderer: {
    image(token: Tokens.Image) {
      const href = token.href ?? "";
      const alt = token.text ?? "";
      if (VIDEO_EXT.test(href)) {
        return `<video src="${href}" controls playsinline preload="metadata"></video>`;
      }
      return `<img src="${href}" alt="${alt}" loading="lazy" />`;
    },
  },
});

export type PostMeta = {
  slug: string; // 文件名（去掉 .md），也是网址的一部分
  title: string; // 标题
  date: string; // 日期，如 "2026-06-20"
  excerpt: string; // 摘要，显示在列表里
  cover: string; // 封面图（可选）
  tags: string[]; // 标签，如 ["生活", "随笔"]
};

export type Post = PostMeta & { html: string };

function readMeta(file: string): PostMeta {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(postsDir, file), "utf8");
  const { data } = matter(raw);
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ? String(data.date).slice(0, 10) : "",
    excerpt: data.excerpt ?? "",
    cover: data.cover ?? "",
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
  };
}

// 读取全部记录，按日期从新到旧排序
export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(postsDir)) return [];
  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .map(readMeta)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// 读取单篇记录，并把 Markdown 正文转成 HTML
export async function getPost(slug: string): Promise<Post | null> {
  const file = path.join(postsDir, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { content } = matter(raw);
  const html = await marked.parse(content);
  return { ...readMeta(`${slug}.md`), html };
}

// 所有标签及其文章数量，按数量从多到少
export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// 某个标签下的所有文章
export function getPostsByTag(tag: string): PostMeta[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}

// 把 "2026-06-20" 显示成 "2026年6月20日"
export function formatDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return date;
  return `${m[1]}年${Number(m[2])}月${Number(m[3])}日`;
}
