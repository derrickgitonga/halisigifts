import { NextResponse } from "next/server";
import { getShopCatalog } from "@/lib/home-catalog";

export const revalidate = 3600;

export async function GET() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");
  const { products, categories } = await getShopCatalog();
  const catById = new Map(categories.map((c) => [c.id, c.name]));

  const lines: string[] = [
    "# Halisi Gifts Shop - Full Live Product Catalog (Kenya)",
    "",
    `> Complete live catalog of ${products.length} 100% original watches, smartwatches, perfumes, jewellery, and gift sets available to order online at Halisi Gifts Shop (${siteUrl}) with flat KSh 250 delivery across Kenya and same-day Nairobi dispatch. WhatsApp: +254729596165.`,
    "",
    "## Categories",
    ...categories.map((c) => `- ${c.name}: ${siteUrl}/category/${c.slug}`),
    "",
    "## Live Products",
    ...products.map((p) => {
      const cat = catById.get(p.categoryId) || "Gifts & Watches";
      const stockLabel = p.inStock ? "In Stock" : "Out of Stock";
      const priceLabel = `KSh ${Math.round(p.price).toLocaleString("en-KE")}`;
      return `- ${p.name} | ${cat} | ${priceLabel} | ${stockLabel} | ${siteUrl}/product/${p.slug}`;
    }),
    "",
  ];

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
