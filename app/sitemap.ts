import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getAllPostSlugs } from "@/lib/blog";
import { getAvailableCitySlugs } from "@/lib/stations";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL;
  const posts = getAllPostSlugs().map((slug) => ({
    url: `${base}/blog/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7
  }));
  const cities = (await getAvailableCitySlugs(30)).map((city) => ({
    url: `${base}/gasolina-barata/${city}`,
    changeFrequency: "daily" as const,
    priority: 0.8
  }));

  return [
    {
      url: base,
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${base}/blog`,
      changeFrequency: "weekly",
      priority: 0.7
    },
    ...posts,
    ...cities
  ];
}
