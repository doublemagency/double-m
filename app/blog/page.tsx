import { BlogBrowser } from "../components/blog-browser";
import { PublicPage } from "../components/public-page";
import { articles } from "../lib/articles";
export const metadata = {
  title: "Recruitment and care resources",
  description:
    "Practical guidance for employers, caregivers, domestic workers and job seekers in Kenya.",
};
export default function Blog() {
  return (
    <PublicPage
      eyebrow="Knowledge centre"
      title="Useful guidance for better working relationships."
      intro="Practical, carefully written resources for employers, families and job seekers—without jargon or empty promises."
    >
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
