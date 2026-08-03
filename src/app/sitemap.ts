import type { MetadataRoute } from "next";
import { getOrigin } from "@/lib/url";

/** XML sitemap for the deployed app (request-derived origin — never localhost). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getOrigin();
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
