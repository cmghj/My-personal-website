import Link from "next/link";
import PostList from "@/components/PostList";
import { getPostsByTag } from "@/lib/posts";

export default async function TagArchive({ name }: { name: string }) {
  const posts = await getPostsByTag(name);
  return (
    <section className="archive-index">
      <Link href="/tags" className="reading-back"><span aria-hidden="true">←</span> 所有标签</Link>
      <header className="archive-heading">
        <h1>{name}</h1>
        {posts.length > 0 && <p>{posts.length} 篇记录</p>}
      </header>
      <PostList posts={posts} heading="h2" />
    </section>
  );
}
