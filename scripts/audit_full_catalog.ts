import { prisma } from "../lib/prisma";
import { getGoogleProductCategory } from "../app/api/meta-feed/route";
import fs from "fs";
import path from "path";

async function auditCatalog() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true, variants: true },
    orderBy: { name: "asc" },
  });

  console.log("=== TOTAL ACTIVE PRODUCTS ===", products.length);

  const missingFields: Array<{ id: string; name: string; missing: string[] }> = [];
  const duplicateSlugs = new Map<string, string[]>();
  const duplicateSkus = new Map<string, string[]>();
  const missingImages: Array<{ productName: string; imageIndex: number; imagePath: string }> = [];
  const categoryGrouping = new Map<string, Array<{ name: string; categoryName?: string; categorySlug?: string }>>();
  const defaultFallbackProducts: Array<{ name: string; category?: string; slug?: string }> = [];

  for (const p of products) {
    const missing: string[] = [];
    if (!p.description || p.description.trim() === "") missing.push("description");
    if (p.price === undefined || p.price === null || Number(p.price) <= 0) missing.push("price");
    if (!p.images || p.images.length === 0 || !p.images[0]) missing.push("images[0]");
    if (!p.slug || p.slug.trim() === "") missing.push("slug");
    if (!p.category) missing.push("category");
    if (missing.length > 0) {
      missingFields.push({ id: p.id, name: p.name, missing });
    }

    if (duplicateSlugs.has(p.slug)) {
      duplicateSlugs.get(p.slug)!.push(p.id);
    } else {
      duplicateSlugs.set(p.slug, [p.id]);
    }

    if (p.sku) {
      if (duplicateSkus.has(p.sku)) {
        duplicateSkus.get(p.sku)!.push(p.id);
      } else {
        duplicateSkus.set(p.sku, [p.id]);
      }
    }

    for (const [idx, img] of p.images.entries()) {
      if (img.startsWith("/")) {
        const filePath = path.join(process.cwd(), "public", decodeURI(img));
        if (!fs.existsSync(filePath)) {
          missingImages.push({ productName: p.name, imageIndex: idx, imagePath: img });
        }
      }
    }

    const gCat = getGoogleProductCategory(p.category?.slug, p.name);
    if (!categoryGrouping.has(gCat)) {
      categoryGrouping.set(gCat, []);
    }
    categoryGrouping.get(gCat)!.push({ name: p.name, categoryName: p.category?.name, categorySlug: p.category?.slug });

    if (gCat === "Apparel & Accessories > Jewelry > Watches") {
      defaultFallbackProducts.push({ name: p.name, category: p.category?.name, slug: p.category?.slug });
    }
  }

  console.log("\n--- 1. MISSING REQUIRED FIELDS ---");
  console.log("Count missing fields:", missingFields.length);

  console.log("\n--- 2. DUPLICATE SLUGS & SKUS ---");
  const dupSlugs = Array.from(duplicateSlugs.entries()).filter(([_, ids]) => ids.length > 1);
  const dupSkus = Array.from(duplicateSkus.entries()).filter(([_, ids]) => ids.length > 1);
  console.log("Duplicate Slugs count:", dupSlugs.length);
  console.log("Duplicate SKUs count:", dupSkus.length);

  console.log("\n--- 3. MISSING IMAGES ON DISK ---");
  console.log("Total Missing Images on Disk:", missingImages.length);

  console.log("\n--- 4. GOOGLE PRODUCT CATEGORY DISTRIBUTION ---");
  for (const [cat, items] of categoryGrouping.entries()) {
    console.log(`- "${cat}": ${items.length} products`);
  }

  console.log("\n--- 5. DEFAULT WATCH CATEGORY FALLTHROUGH AUDIT ---");
  console.log("Total products in default Watch category:", defaultFallbackProducts.length);
  const nonWatchFallingThrough = defaultFallbackProducts.filter(
    (p) =>
      !p.slug?.includes("watch") &&
      p.slug !== "analogue-watches" &&
      p.slug !== "digital-watches"
  );
  console.log("Non-watch category products falling through to default watch category:", nonWatchFallingThrough.length);
  if (nonWatchFallingThrough.length > 0) {
    console.log(JSON.stringify(nonWatchFallingThrough, null, 2));
  }
}

auditCatalog().finally(() => prisma.$disconnect());
