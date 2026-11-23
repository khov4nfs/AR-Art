import type { MetadataRoute } from "next";
import { getDatabase } from "@/lib/store";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const db = await getDatabase();
  const baseUrl = db.settings.seoCanonical || "https://everievn.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
