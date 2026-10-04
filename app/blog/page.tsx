import { BlogBrowser } from "../components/blog-browser";
import { PublicPage } from "../components/public-page";
import { articles } from "../lib/articles";
import Image from "next/image";
export const metadata = {
  title: "Recruitment and care resources",
  description:
    "Practical guidance for employers, caregivers, domestic workers and job seekers in Kenya.",
};
export default function Blog() {
  return (
    <PublicPage
      eyebrow="Guides"
      title="Advice for homes and workers."
      intro="Practical articles for employers, families and job seekers."
    >
      <section className="blog-banner shell">
        <Image
          src="/images/care-story.webp"
          fill
          priority
          sizes="(max-width: 700px) 100vw, 1200px"
          alt="A caregiver, home professional and nanny supporting everyday family life"
        />
        <div>
          <span>Practical guidance from Double M</span>
          <h2>Better hiring. Safer homes. Fairer working relationships.</h2>
        </div>
      </section>
      <BlogBrowser
        initial={articles.map((a) => ({
          slug: a.slug,
          title: a.title,
          excerpt: a.excerpt,
          read: a.read,
          cover_image: a.cover,
        }))}
      />
    </PublicPage>
  );
}
