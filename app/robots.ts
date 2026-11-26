import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/admin/", "/api/", "/order/", "/cart", "/checkout", "/wishlist"],
      },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
          "Applebot-Extended",
          "Google-Extended",
        ],
        allow: ["/", "/llms.txt", "/llms-full.txt", "/product/", "/category/", "/collections/", "/blog/"],
        disallow: ["/admin/", "/api/", "/order/", "/cart", "/checkout", "/wishlist"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
