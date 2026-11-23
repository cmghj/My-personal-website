import TagArchive from "@/components/TagArchive";

export const dynamic = "force-dynamic";

async function tagName(props: PageProps<"/tags/[tag]">) {
  const { tag } = await props.params;
  try {
    return decodeURIComponent(tag);
  } catch {
    return tag;
  }
}

export async function generateMetadata(props: PageProps<"/tags/[tag]">) {
  return { title: `标签 · ${await tagName(props)}` };
}

export default async function TagPage(props: PageProps<"/tags/[tag]">) {
  return <TagArchive name={await tagName(props)} />;
}
