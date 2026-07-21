"use client";
import Link from "next/link";
import { ArrowRight, Clock3, Search } from "lucide-react";
import { useEffect, useState } from "react";
type Item = {
  slug: string;
  title: string;
  excerpt: string;
  read?: string;
  cover_image?: string;
};
export function BlogBrowser({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial),
    [query, setQuery] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { articles: [] }))
      .then((x) => {
        const remote = x.articles as Item[],
          slugs = new Set(remote.map((item) => item.slug));
        setItems([
          ...remote,
          ...initial.filter((item) => !slugs.has(item.slug)),
        ]);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [initial]);
  const shown = items.filter((x) =>
    `${x.title} ${x.excerpt}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="blog-search">
        <Search />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles"
          aria-label="Search articles"
        />
      </div>
      <section className="article-grid article-rail shell">
        {shown.map((a) => (
          <article key={a.slug}>
            {a.cover_image && (
              <div
                className="article-cover"
                style={{
                  backgroundImage: `url(${a.cover_image.startsWith("/") ? a.cover_image : `${process.env.NEXT_PUBLIC_API_URL}/media/articles/${a.cover_image}`})`,
                }}
              />
            )}
            <span>
              <Clock3 /> {a.read || "Agency article"}
            </span>
            <h2>{a.title}</h2>
            <p>{a.excerpt}</p>
            <Link href={`/blog/${a.slug}`}>
              Read more <ArrowRight />
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}
