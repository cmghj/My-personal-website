import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

// 所有记录（Markdown 文件）都放在这个文件夹里
const postsDir = path.join(process.cwd(), "content", "posts");

export type PostMeta = {
  slug: string; // 文件名（去掉 .md），也是网址的一部分
  title: string; // 标题
  date: string; // 日期，如 "2026-06-20"
  excerpt: string; // 摘要，显示在列表里
  cover: string; // 封面图（可选），放在 public/ 里，如 "/photos/xxx.jpg"
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

// 把 "2026-06-20" 显示成 "2026年6月20日"
export function formatDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return date;
  return `${m[1]}年${Number(m[2])}月${Number(m[3])}日`;
}
