import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";
import { getGoogleProductCategory } from "../app/api/meta-feed/route";

async function fullCatalogAudit() {
  console.log("==========================================================");
  console.log("1. DATABASE URL AND ENGINE CHECK");
  console.log("==========================================================");
  console.log("process.env.DATABASE_URL:", process.env.DATABASE_URL);

  console.log("\n==========================================================");
  console.log("2. CURRENT CATEGORIES IN DB");
  console.log("==========================================================");
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: "asc" },
  });
  console.log("Total categories found in DB:", categories.length);
  for (const c of categories) {
    console.log(` - ID: ${c.id} | Name: "${c.name}" | Slug: "${c.slug}" | Product Count: ${c._count.products}`);
  }

  console.log("\n==========================================================");
  console.log("3. CURRENT TOTAL PRODUCTS IN DB");
  console.log("==========================================================");
  const totalProducts = await prisma.product.count();
  const activeProductsCount = await prisma.product.count({ where: { isActive: true } });
  const inactiveProductsCount = await prisma.product.count({ where: { isActive: false } });
  console.log("Total Products in DB:", totalProducts);
  console.log("Active Products in DB:", activeProductsCount);
  console.log("Inactive Products in DB:", inactiveProductsCount);

  console.log("\n==========================================================");
  console.log("4. PRODUCT DISTRIBUTION BY CATEGORY");
  console.log("==========================================================");
  const allProducts = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      price: true,
      description: true,
      images: true,
      stock: true,
      isActive: true,
      category: {
        select: { id: true, name: true, slug: true },
      },
      variants: {
        select: { id: true, name: true, sku: true },
      },
    },
  });

  const catCounts: Record<string, number> = {};
  for (const p of allProducts) {
    const catName = p.category?.name || "UNCATEGORIZED";
    catCounts[catName] = (catCounts[catName] || 0) + 1;
  }
  console.table(catCounts);

  console.log("\n==========================================================");
  console.log("5. CHECKING ITEMS PREVIOUSLY IN SPECIAL CATEGORIES");
  console.log("==========================================================");
  const giftKeywords = ["gift", "valentine", "mother", "set", "pack", "organizer", "box", "wallet", "cufflink", "belt"];
  const giftMatches = allProducts.filter((p) =>
    giftKeywords.some((k) => p.name.toLowerCase().includes(k))
  );
  console.log(`Products matching gift/set/pack/box/etc. (${giftMatches.length} total):`);
  for (const p of giftMatches) {
    console.log(` • [${p.category.name}] "${p.name}" (Slug: ${p.slug})`);
  }

  const coupleKeywords = ["couple", "pair", "unisex", "his & her", "his and her", "matching"];
  const coupleMatches = allProducts.filter((p) =>
    coupleKeywords.some((k) => p.name.toLowerCase().includes(k))
  );
  console.log(`\nProducts matching couple/pair/unisex (${coupleMatches.length} total):`);
  for (const p of coupleMatches) {
    console.log(` • [${p.category.name}] "${p.name}" (Slug: ${p.slug})`);
  }

  console.log("\n==========================================================");
  console.log("6. META & TIKTOK TAXONOMY FALLTHROUGH AUDIT (100% OF ACTIVE PRODUCTS)");
  console.log("==========================================================");
  const metaDistribution: Record<string, number> = {};
  let miscategorizedCount = 0;
  const miscategorizedItems: string[] = [];

  for (const p of allProducts) {
    const metaCat = getGoogleProductCategory(p.category.slug, p.name);
    metaDistribution[metaCat] = (metaDistribution[metaCat] || 0) + 1;

    // Check if non-watch was classified as Watch
    if (metaCat === "Apparel & Accessories > Jewelry > Watches") {
      const lower = (p.name + " " + p.category.name).toLowerCase();
      if (
        lower.includes("perfume") ||
        lower.includes("oud") ||
        lower.includes("lattafa") ||
        lower.includes("necklace") ||
        lower.includes("bracelet") ||
        lower.includes("pendant") ||
        lower.includes("watch box") ||
        lower.includes("watch organizer") ||
        lower.includes("smart watch") ||
        lower.includes("smartwatch")
      ) {
        miscategorizedCount++;
        miscategorizedItems.push(`"${p.name}" [Category: ${p.category.name}] -> mapped to: ${metaCat}`);
      }
    }
  }

  console.log(`Google Product Category Distribution for all ${allProducts.length} active products:`);
  console.table(metaDistribution);
  console.log("Miscategorized count:", miscategorizedCount);
  if (miscategorizedCount > 0) {
    console.log("Miscategorized items:", miscategorizedItems);
  }

  console.log("\n==========================================================");
  console.log("7. FULL DATA INTEGRITY AUDIT (SLUGS, SKUS, IMAGES, REQUIRED FIELDS)");
  console.log("==========================================================");
  const slugs = new Set<string>();
  const duplicateSlugs: string[] = [];
  const skus = new Set<string>();
  const duplicateSkus: string[] = [];
  let missingRequiredFields = 0;
  let missingImagesOnDisk = 0;
  const missingImageFiles: string[] = [];
  const freshProducts = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      price: true,
      description: true,
      images: true,
      stock: true,
      isActive: true,
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  for (const p of freshProducts) {
    // Slug check
    if (!p.slug || slugs.has(p.slug)) {
      duplicateSlugs.push(p.slug || "EMPTY_SLUG");
    }
    slugs.add(p.slug);

    // SKU check
    if (!p.sku || skus.has(p.sku)) {
      duplicateSkus.push(p.sku || "EMPTY_SKU");
    }
    skus.add(p.sku);

    // Required fields check
    if (!p.name || !p.price || !p.description || p.images?.length === 0 || !p.category) {
      missingRequiredFields++;
      console.log(`[FIELD WARNING] Raw Object:`, p);
    }

    // Image disk check
    for (const img of p.images) {
      if (img.startsWith("/")) {
        const fullLocalPath = path.join(process.cwd(), "public", decodeURI(img));
        if (!fs.existsSync(fullLocalPath)) {
          missingImagesOnDisk++;
          missingImageFiles.push(`Product: "${p.name}" -> Image: ${img}`);
        }
      }
    }
  }

  console.log(`Total Products Audited: ${allProducts.length}`);
  console.log(`Total Unique Slugs: ${slugs.size} | Duplicate Slugs: ${duplicateSlugs.length}`);
  console.log(`Total Unique Product SKUs: ${skus.size} | Duplicate SKUs: ${duplicateSkus.length}`);
  console.log(`Products Missing Required Fields: ${missingRequiredFields}`);
  console.log(`Images Missing on Disk in public/: ${missingImagesOnDisk}`);
}

fullCatalogAudit().finally(() => prisma.$disconnect());
