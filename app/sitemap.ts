import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/llms.txt`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/llms-full.txt`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/track-order`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/shipping-returns`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/store-locator`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  try {
    const [products, categories, blogPosts] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true, images: true },
      }),
      prisma.category.findMany({
        select: { slug: true, updatedAt: true },
      }),
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${baseUrl}/category/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    }));

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => {
      const firstImg = p.images?.[0];
      const imageUrl = firstImg
        ? firstImg.startsWith("http")
          ? firstImg
          : `${baseUrl}${firstImg.startsWith("/") ? "" : "/"}${firstImg}`
        : undefined;

      return {
        url: `${baseUrl}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "daily",
        priority: 0.8,
        ...(imageUrl ? { images: [encodeURI(imageUrl)] } : {}),
      };
    });

    const uniqueMap = new Map<string, MetadataRoute.Sitemap[number]>();
    for (const item of [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes]) {
      uniqueMap.set(item.url, item);
    }

    return Array.from(uniqueMap.values());
  } catch {
    return staticRoutes;
  }
}
