import type { MetadataRoute } from "next";
import { getOrigin } from "@/lib/url";

/** robots.txt for the deployed app (API endpoints are not for crawlers). */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getOrigin();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
