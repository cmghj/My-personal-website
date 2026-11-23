import Link from "next/link";
import TagArchive from "@/components/TagArchive";
import { tagHref } from "@/lib/entry-format";
import { getAllTags } from "@/lib/posts";

export const dynamic = "force-dynamic";

async function selectedTag(props: PageProps<"/tags">) {
  const { name } = await props.searchParams;
  return typeof name === "string" ? name : undefined;
}

export async function generateMetadata(props: PageProps<"/tags">) {
  const name = await selectedTag(props);
  return { title: name ? `标签 · ${name}` : "标签" };
}

export default async function TagsPage(props: PageProps<"/tags">) {
  const name = await selectedTag(props);
  if (name) return <TagArchive name={name} />;

  const tags = await getAllTags();

  return (
    <section className="archive-index">
      <header className="archive-heading">
        <h1>标签</h1>
        {tags.length > 0 && <p>{tags.length} 个主题</p>}
      </header>
      {tags.length ? (
        <ul className="archive-topics">
          {tags.map(({ tag, count }) => (
            <li key={tag}>
              <Link href={tagHref(tag)}>
                <span>{tag}</span>
                <small>{count} 篇 <i aria-hidden="true">→</i></small>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="archive-empty">
          <p>还没有公开记录使用标签。</p>
          <Link href="/gallery">去看相册 <span aria-hidden="true">→</span></Link>
        </div>
      )}
    </section>
  );
}
