import "server-only";

import { marked, type Tokens } from "marked";
import { createPublicClient } from "@/lib/supabase/public";

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
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  cover: string;
  tags: string[];
  kind: string;
  location: string;
  mood: string;
};

export type Post = PostMeta & { html: string };

type EntryTagRelation = {
  tags: { name: string } | { name: string }[] | null;
};

type DatabaseEntry = {
  slug: string;
  title: string;
  occurred_at: string;
  excerpt: string;
  cover_url: string;
  kind: string;
  location: string;
  mood: string;
  content_markdown?: string;
  entry_tags?: EntryTagRelation[];
};

function relationTags(relations: EntryTagRelation[] | undefined): string[] {
  if (!relations) return [];

  return relations.flatMap((relation) => {
    if (!relation.tags) return [];
    if (Array.isArray(relation.tags)) {
      return relation.tags.map((tag) => tag.name);
    }
    return [relation.tags.name];
  });
}

function databaseMeta(entry: DatabaseEntry): PostMeta {
  return {
    slug: entry.slug,
    title: entry.title,
    date: entry.occurred_at,
    excerpt: entry.excerpt,
    cover: entry.cover_url,
    tags: relationTags(entry.entry_tags),
    kind: entry.kind,
    location: entry.location,
    mood: entry.mood,
  };
}

async function getDatabasePosts(): Promise<PostMeta[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("entries")
    .select(
      "slug,title,occurred_at,excerpt,cover_url,kind,location,mood,entry_tags(tags(name))",
    )
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("occurred_at", { ascending: false });

  if (error) {
    throw new Error(`读取公开记录失败：${error.message}`);
  }

  return (data as unknown as DatabaseEntry[]).map(databaseMeta);
}

export async function getAllPosts(): Promise<PostMeta[]> {
  return getDatabasePosts();
}

export async function getPost(slug: string): Promise<Post | null> {
  const supabase = createPublicClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("entries")
      .select(
        "slug,title,occurred_at,excerpt,cover_url,kind,location,mood,content_markdown,entry_tags(tags(name))",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .in("visibility", ["public", "unlisted"])
      .is("deleted_at", null)
      .maybeSingle();

    if (!error && data) {
      const entry = data as unknown as DatabaseEntry;
      return {
        ...databaseMeta(entry),
        html: await marked.parse(entry.content_markdown ?? ""),
      };
    }

    if (error) throw new Error(`读取记录失败：${error.message}`);
  }

  return null;
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const counts = new Map<string, number>();
  for (const post of await getAllPosts()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "zh-CN"));
}

export async function getPostsByTag(tag: string): Promise<PostMeta[]> {
  return (await getAllPosts()).filter((post) => post.tags.includes(tag));
}

export async function getAdjacentPosts(slug: string): Promise<{
  newer: PostMeta | null;
  older: PostMeta | null;
}> {
  const posts = await getAllPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return { newer: null, older: null };
  return {
    newer: index > 0 ? posts[index - 1] : null,
    older: index < posts.length - 1 ? posts[index + 1] : null,
  };
}

export function formatDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return date;
  return `${match[1]}年${Number(match[2])}月${Number(match[3])}日`;
}

export function formatEntryKind(kind: string): string {
  return {
    article: "文章",
    note: "随手记",
    photo_story: "照片故事",
    video: "视频记录",
    year_review: "年度回顾",
  }[kind] ?? "记录";
}
