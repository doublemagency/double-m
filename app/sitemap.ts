import type { MetadataRoute } from "next";
import { articles } from "./lib/articles";
export default function sitemap(): MetadataRoute.Sitemap {
  const b = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    paths = [
      "",
      "/about",
      "/about/founder",
      "/services",
      "/jobs",
      "/hire",
      "/register",
      "/blog",
      "/faqs",
      "/testimonials",
      "/contact",
      "/privacy",
      "/fraud-safety",
      ...articles.map((a) => `/blog/${a.slug}`),
    ];
  return paths.map((path) => ({
    url: `${b}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/jobs" ? "daily" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
