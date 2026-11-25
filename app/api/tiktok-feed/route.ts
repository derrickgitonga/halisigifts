import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGoogleProductCategory } from "@/app/api/meta-feed/route";

export const dynamic = "force-dynamic";

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/\r\n|\r|\n/g, " ").trim();
  return `"${str.replace(/"/g, '""')}"`;
}

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

function slugifyVariant(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface FeedItem {
  sku_id: string;
  item_group_id: string;
  title: string;
  description: string;
  availability: string;
  condition: string;
  price: string;
  sale_price: string;
  link: string;
  image_link: string;
  additional_image_links: string[];
  brand: string;
  google_product_category: string;
  product_type: string;
  custom_label_0: string;
}

export async function GET(req: NextRequest) {
  try {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");
    const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get("format")?.toLowerCase() || "csv";

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: true,
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const feedItems: FeedItem[] = [];

    for (const p of products) {
      const basePrice = Number(p.price);
      if (isNaN(basePrice) || basePrice <= 0 || !p.name || !p.slug) {
        console.warn(`[TikTok Feed Warning] Skipping invalid product ID ${p.id}: missing price or title.`);
        continue;
      }

      const compareAtPrice = p.compareAtPrice ? Number(p.compareAtPrice) : null;
      const categoryName = p.category?.name || "Watches & Accessories";
      const googleCat = getGoogleProductCategory(p.category?.slug || "", p.name || "");
      const customLabel = p.isNew
        ? "New Arrival"
        : p.isHotDeal
        ? "Hot Deal"
        : p.isFeatured
        ? "Featured"
        : "";

      const primaryImg = p.images[0] || "/products/fallback.jpg";
      const primaryImgUrl = formatUrl(siteUrl, primaryImg);
      const additionalImgUrls = p.images.slice(1, 10).map((img) => formatUrl(siteUrl, img));
      const description = p.description?.trim() || p.name;
      const baseLink = formatUrl(siteUrl, `/product/${p.slug}`);

      // Determine price vs sale_price formatting
      let regularPriceFormatted = `${basePrice.toFixed(2)} KES`;
      let salePriceFormatted = "";
      if (compareAtPrice && compareAtPrice > basePrice) {
        regularPriceFormatted = `${compareAtPrice.toFixed(2)} KES`;
        salePriceFormatted = `${basePrice.toFixed(2)} KES`;
      }

      // Base Product Entry (matches content_id sent by pixel on parent view)
      feedItems.push({
        sku_id: p.id,
        item_group_id: p.id,
        title: p.name,
        description,
        availability: p.stock > 0 ? "in stock" : "out of stock",
        condition: "new",
        price: regularPriceFormatted,
        sale_price: salePriceFormatted,
        link: baseLink,
        image_link: primaryImgUrl,
        additional_image_links: additionalImgUrls,
        brand: "Halisi",
        google_product_category: googleCat,
        product_type: categoryName,
        custom_label_0: customLabel,
      });

      // Distinct Variant Entries (if any exist)
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const varModifier = Number(v.priceModifier || 0);
          const varPrice = basePrice + varModifier;
          let varRegularPriceFormatted = `${varPrice.toFixed(2)} KES`;
          let varSalePriceFormatted = "";

          if (compareAtPrice && compareAtPrice > varPrice) {
            varRegularPriceFormatted = `${(compareAtPrice + varModifier).toFixed(2)} KES`;
            varSalePriceFormatted = `${varPrice.toFixed(2)} KES`;
          }

          const varImg = v.image ? formatUrl(siteUrl, v.image) : primaryImgUrl;
          const varLink = formatUrl(siteUrl, `/product/${p.slug}?variant=${slugifyVariant(v.name)}`);
          const varStock = v.stock !== undefined && v.stock !== null ? v.stock : p.stock;

          feedItems.push({
            sku_id: `${p.id}_${v.id}`,
            item_group_id: p.id,
            title: `${p.name} - ${v.name}`,
            description,
            availability: varStock > 0 ? "in stock" : "out of stock",
            condition: "new",
            price: varRegularPriceFormatted,
            sale_price: varSalePriceFormatted,
            link: varLink,
            image_link: varImg,
            additional_image_links: additionalImgUrls,
            brand: "Halisi",
            google_product_category: googleCat,
            product_type: categoryName,
            custom_label_0: customLabel,
          });
        }
      }
    }

    // CSV format output
    if (format === "csv") {
      const headers = [
        "sku_id",
        "item_group_id",
        "title",
        "description",
        "availability",
        "condition",
        "price",
        "sale_price",
        "link",
        "image_link",
        "additional_image_link",
        "brand",
        "google_product_category",
        "product_type",
        "custom_label_0",
      ];

      const csvRows = [headers.join(",")];

      for (const item of feedItems) {
        const row = [
          escapeCsvField(item.sku_id),
          escapeCsvField(item.item_group_id),
          escapeCsvField(item.title),
          escapeCsvField(item.description),
          escapeCsvField(item.availability),
          escapeCsvField(item.condition),
          escapeCsvField(item.price),
          escapeCsvField(item.sale_price),
          escapeCsvField(item.link),
          escapeCsvField(item.image_link),
          escapeCsvField(item.additional_image_links.join(",")),
          escapeCsvField(item.brand),
          escapeCsvField(item.google_product_category),
          escapeCsvField(item.product_type),
          escapeCsvField(item.custom_label_0),
        ];
        csvRows.push(row.join(","));
      }

      return new NextResponse(csvRows.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      });
    }

    // XML format output
    const itemsXml = feedItems
      .map((item) => {
        const additionalXml = item.additional_image_links
          .map((img) => `      <additional_image_link>${img}</additional_image_link>`)
          .join("\n");

        return `    <item>
      <sku_id>${item.sku_id}</sku_id>
      <item_group_id>${item.item_group_id}</item_group_id>
      <title>${sanitizeXmlText(item.title)}</title>
      <description>${sanitizeXmlText(item.description)}</description>
      <availability>${item.availability}</availability>
      <condition>${item.condition}</condition>
      <price>${item.price}</price>${item.sale_price ? `\n      <sale_price>${item.sale_price}</sale_price>` : ""}
      <link>${item.link}</link>
      <image_link>${item.image_link}</image_link>${additionalXml ? "\n" + additionalXml : ""}
      <brand>${sanitizeXmlText(item.brand)}</brand>
      <google_product_category>${sanitizeXmlText(item.google_product_category)}</google_product_category>
      <product_type>${sanitizeXmlText(item.product_type)}</product_type>${item.custom_label_0 ? `\n      <custom_label_0>${sanitizeXmlText(item.custom_label_0)}</custom_label_0>` : ""}
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Halisi Gifts Shop TikTok Product Feed</title>
    <link>${siteUrl}</link>
    <description>Dynamic product catalog feed for Halisi Gifts Shop TikTok Catalog and Dynamic Showcase Ads</description>
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
    const message = error instanceof Error ? error.message : "Failed to generate TikTok feed";
    console.error("[TikTok Feed Error]:", message);
    return new NextResponse(`Error generating TikTok feed: ${message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
