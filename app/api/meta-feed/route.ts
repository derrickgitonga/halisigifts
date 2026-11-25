import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function sanitizeXmlText(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatUrl(base: string, pathOrUrl: string): string {
  const full = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
  return encodeURI(full);
}

export function getGoogleProductCategory(categorySlug: string = "", productName: string = ""): string {
  const slug = categorySlug.toLowerCase();
  const name = productName.toLowerCase();

  if (
    slug === "perfumes-fragrances" ||
    name.includes("perfume") ||
    name.includes("lattafa") ||
    name.includes("oud") ||
    name.includes("fragrance")
  ) {
    return "Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne";
  }

  if (slug === "smart-watches" || name.includes("smart watch") || name.includes("smartwatch")) {
    return "Electronics > Communications > Telephony > Mobile Phones > Smartwatches";
  }

  if (
    slug === "jewellery" ||
    slug === "jewellery-accessories" ||
    name.includes("necklace") ||
    name.includes("bracelet") ||
    name.includes("jewellery") ||
    name.includes("pendant")
  ) {
    return "Apparel & Accessories > Jewelry";
  }

  if (name.includes("purse") || name.includes("wallet") || (name.includes("bag") && !name.includes("gift"))) {
    return "Apparel & Accessories > Handbags, Wallets & Cases > Handbags";
  }

  if (
    slug === "accessories-gift-boxes" ||
    name.includes("watch organizer") ||
    name.includes("watch box") ||
    name.includes("executive box") ||
    name.includes("watch stand") ||
    name.includes("presentation stand") ||
    name.includes("ring holder") ||
    name.includes("organizer") ||
    name.includes("holder")
  ) {
    return "Home & Garden > Decor > Home Storage & Organization > Jewelry & Watch Boxes";
  }

  if (
    slug === "valentines-gift-sets" ||
    slug === "mothers-day-gift-sets" ||
    slug === "gifts-accessories" ||
    name.includes("gift set") ||
    name.includes("gift pack") ||
    name.includes("gift card")
  ) {
    return "Apparel & Accessories > Jewelry & Watch Accessories > Gift Sets";
  }

  return "Apparel & Accessories > Jewelry > Watches";
}

export async function GET() {
  try {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const itemsXml = products
      .map((p) => {
        const id = p.id;
        const title = sanitizeXmlText(p.name);
        const description = sanitizeXmlText(p.description || p.name);
        const link = formatUrl(siteUrl, `/product/${p.slug}`);
        const primaryImage = p.images[0] || "/products/fallback.jpg";
        const imageLink = formatUrl(siteUrl, primaryImage);
        const availability = p.stock > 0 ? "in stock" : "out of stock";
        const basePrice = Number(p.price);
        const comparePrice = p.compareAtPrice ? Number(p.compareAtPrice) : null;
        const hasSale = comparePrice !== null && comparePrice > basePrice;
        const price = `${(hasSale ? comparePrice : basePrice).toFixed(2)} KES`;
        const salePriceXml = hasSale
          ? `\n      <g:sale_price>${basePrice.toFixed(2)} KES</g:sale_price>`
          : "";
        const categoryName = sanitizeXmlText(p.category?.name || "Watches & Accessories");
        const googleCategory = sanitizeXmlText(
          getGoogleProductCategory(p.category?.slug || "", p.name || "")
        );

        const additionalImagesXml = p.images
          .slice(1, 11)
          .map((img) => `      <g:additional_image_link>${formatUrl(siteUrl, img)}</g:additional_image_link>`)
          .join("\n");

        return `    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>${additionalImagesXml ? "\n" + additionalImagesXml : ""}
      <g:brand>Halisi</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>${salePriceXml}
      <g:product_type>${categoryName}</g:product_type>
      <g:google_product_category>${googleCategory}</g:google_product_category>
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Halisi Gifts Shop Product Feed</title>
    <link>${siteUrl}</link>
    <description>Dynamic product catalog feed for Halisi Gifts Shop Meta Advantage+ and Dynamic Product Ads</description>
${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate feed";
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><error>${sanitizeXmlText(message)}</error>`,
      {
        status: 500,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      }
    );
  }
}
