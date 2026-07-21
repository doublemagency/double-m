import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ShareButton } from "../../components/share-button";
import { SiteHeader } from "../../components/site-header";
import { article, articles } from "../../lib/articles";

type ManagedArticle = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image?: string;
};
export function generateStaticParams() {
  return articles.map((item) => ({ slug: item.slug }));
}
async function managed(slug: string): Promise<ManagedArticle | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/articles/${slug}`,
      { next: { revalidate: 300 } },
    );
    return response.ok ? (await response.json()).article : null;
  } catch {
    return null;
  }
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const slug = (await params).slug;
  const item = article(slug) || (await managed(slug));
  return item
    ? {
        title: item.title,
        description: item.excerpt,
        alternates: { canonical: `/blog/${item.slug}` },
        openGraph: {
          title: item.title,
          description: item.excerpt,
          type: "article",
        },
      }
    : {};
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const approved = await managed(slug);
  const local = approved ? undefined : article(slug);
  if (!local && !approved) notFound();
  const title = local?.title || approved!.title,
    excerpt = local?.excerpt || approved!.excerpt;
  const cover =
    local?.cover ||
    (approved?.cover_image
      ? `${process.env.NEXT_PUBLIC_API_URL}/media/articles/${approved.cover_image}`
      : "/images/recruitment-hero.webp");
  return (
    <>
      <SiteHeader />
      <main>
        <article className="article-page">
          <header className="article-visual-header">
            <Image src={cover} fill priority unoptimized sizes="100vw" alt="" />
            <div className="article-header-wash" />
            <div className="article-header-copy">
              <span>Double M Agency guide</span>
              <h1>{title}</h1>
              <p>{excerpt}</p>
              <ShareButton title={title} />
            </div>
          </header>
          <div className="article-body">
            {local ? (
              local.sections.map(([heading, text]) => (
                <section key={heading}>
                  <h2>{heading}</h2>
                  <p>{text}</p>
                </section>
              ))
            ) : (
              <section
                className="managed-article"
                dangerouslySetInnerHTML={{ __html: approved!.content }}
              />
            )}
            <aside>
              <b>Need support with a real recruitment decision?</b>
              <p>
                Speak with Double M Agency about your staffing requirements or
                create a candidate profile for suitable opportunities.
              </p>
              <a href="/hire">Request staff</a>{" "}
              <a href="/register">Register for work</a>
            </aside>
          </div>
        </article>
      </main>
    </>
  );
}
