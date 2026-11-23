import Link from "next/link";
import PostList from "@/components/PostList";
import { getLatestGalleryPhoto } from "@/lib/media";
import { formatDate, formatEntryKind, getAllPosts } from "@/lib/posts";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [posts, settings] = await Promise.all([getAllPosts(), getSiteSettings()]);
  const [lead, ...others] = posts;

  if (!lead) {
    const photo = await getLatestGalleryPhoto();
    const caption = photo?.caption || photo?.original_name.replace(/\.[^.]+$/, "");
    return (
      <section className={`home-opening ${photo ? "with-photo" : "only-text"}`}>
        <div className="opening-copy">
          <h1>{settings.siteTitle}</h1>
          <p>{settings.homeIntro}</p>
          <div className="home-actions">
            <Link className="ink-link" href="/gallery">翻看相册</Link>
            <Link className="quiet-link" href="/about">关于这个小站</Link>
          </div>
        </div>
        {photo && (
          <figure className="album-print">
            <Link href="/gallery" aria-label={`在相册中查看${caption}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.public_url} alt={caption} fetchPriority="high" />
            </Link>
            <figcaption>
              <span>{caption}</span>
              <time dateTime={photo.captured_at ?? photo.created_at}>{formatDate(photo.captured_at ?? photo.created_at)}</time>
            </figcaption>
          </figure>
        )}
      </section>
    );
  }

  const href = `/posts/${lead.slug}`;
  return (
    <div className="home-journal">
      <p className="journal-intro">{settings.homeIntro}</p>
      <section className={`lead-entry ${lead.cover ? "with-cover" : "text-entry"}`}>
        <div className="lead-copy">
          <div className="lead-meta"><time dateTime={lead.date}>{formatDate(lead.date)}</time><span>{formatEntryKind(lead.kind)}</span></div>
          <h1><Link href={href}>{lead.title}</Link></h1>
          {lead.excerpt && <p>{lead.excerpt}</p>}
          <Link href={href} className="ink-link" aria-label={`阅读全文：${lead.title}`}>阅读全文</Link>
        </div>
        {lead.cover && (
          <Link href={href} className="lead-photo" aria-label={`阅读${lead.title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lead.cover} alt="" fetchPriority="high" />
          </Link>
        )}
      </section>
      {others.length > 0 && (
        <section className="home-more" aria-labelledby="more-entries">
          <h2 id="more-entries">更多记录</h2>
          <PostList posts={others} />
        </section>
      )}
    </div>
  );
}
