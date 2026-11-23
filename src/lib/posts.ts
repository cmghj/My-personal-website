import "server-only";

import { cache } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { createPublicClient } from "@/lib/supabase/public";

export { formatDate, formatEntryKind } from "@/lib/entry-format";

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

async function listPublicEntries<Columns extends string>(columns: Columns) {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("entries")
    .select(columns)
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("occurred_at", { ascending: false });

  if (error) {
    throw new Error(`读取公开记录失败：${error.message}`);
  }

  return data;
}

export const getAllPosts = cache(async (): Promise<PostMeta[]> => {
  const entries = await listPublicEntries(
    "slug,title,occurred_at,excerpt,cover_url,kind,location,mood,entry_tags(tags(name))",
  );
  return (entries as unknown as DatabaseEntry[]).map(databaseMeta);
});

export const getPost = cache(async (slug: string): Promise<Post | null> => {
  const supabase = createPublicClient();
  if (!supabase) return null;

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

  if (error) throw new Error(`读取记录失败：${error.message}`);
  if (!data) return null;
  const entry = data as unknown as DatabaseEntry;
  return { ...databaseMeta(entry), html: renderMarkdown(entry.content_markdown ?? "") };
});

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const counts = new Map<string, number>();
  const entries = await listPublicEntries("entry_tags(tags(name))");
  for (const entry of entries) {
    for (const tag of relationTags(entry.entry_tags)) {
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
  newer: Pick<PostMeta, "slug" | "title"> | null;
  older: Pick<PostMeta, "slug" | "title"> | null;
}> {
  const posts = await listPublicEntries("slug,title");
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return { newer: null, older: null };
  return {
    newer: index > 0 ? posts[index - 1] : null,
    older: index < posts.length - 1 ? posts[index + 1] : null,
  };
}
