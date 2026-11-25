import { prisma } from "../lib/prisma";
import {
  getRelatedProducts,
  getSmartSearchResults,
  extractBrand
} from "../lib/recommendations";

async function verifyIntegration() {
  console.log("=====================================================================");
  console.log("BATCH 2 CATALOG INTEGRATION & VERIFICATION REPORT");
  console.log("=====================================================================\n");

  // 1. Overall DB Counts
  const totalCategories = await prisma.category.count();
  const totalProducts = await prisma.product.count();
  const activeProducts = await prisma.product.count({ where: { isActive: true } });
  const inactiveProducts = await prisma.product.count({ where: { isActive: false } });
  const totalVariants = await prisma.productVariant.count();

  console.log("--- 1. DATABASE TOTAL COUNTS ---");
  console.log(`Total Categories:       ${totalCategories}`);
  console.log(`Total Products:         ${totalProducts}`);
  console.log(`Active Products (Live): ${activeProducts}`);
  console.log(`Inactive Products:      ${inactiveProducts}`);
  console.log(`Total Product Variants: ${totalVariants}`);

  // 2. Category breakdown
  console.log("\n--- 2. CATEGORY BREAKDOWN ---");
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } }
    },
    orderBy: { name: "asc" }
  });
  categories.forEach((cat) => {
    console.log(`- ${cat.name.padEnd(30)}: ${cat._count.products} products (slug: ${cat.slug})`);
  });

  // 3. Verify Original 76 Products Are Intact
  console.log("\n--- 3. VERIFYING ORIGINAL BATCH 1 PRODUCTS INTEGRITY ---");
  const spotCheckOriginal = [
    "casio-edifice-gents-watch",
    "curren-ladies-9097-metallic",
    "casio-square",
    "amber-oud-by-haramain-perfumes",
    "valentines-men-gift-set",
    "6-in-1-mothers-day-gift-pack",
    "stainless-steel-3pc-jewellery-sets",
    "wooden-executive-boxes"
  ];

  for (const slug of spotCheckOriginal) {
    const p = await prisma.product.findUnique({
      where: { slug },
      include: { category: true, variants: true }
    });
    if (p) {
      console.log(`✓ Original product intact: "${p.name}" (SKU: ${p.sku}, Price: KES ${p.price}, Variants: ${p.variants.length})`);
    } else {
      console.error(`✗ ERROR: Original product missing: ${slug}`);
    }
  }

  // 4. Verify Brand Extraction for Batch 2 Brands
  console.log("\n--- 4. TESTING BRAND EXTRACTION FOR BATCH 2 ---");
  const brandTestNames = [
    "MICHAEL KORS (MK) CHRONOGRAPH",
    "LIGE LG8963A",
    "DANIEL WELLINGTON LADIES WATCH X BRACELET",
    "OPK COUPLE WATCH",
    "Poedagar Gents",
    "OCHSTIN CHRONOGRAPH GENTS WATCH",
    "SKMEI Men Digital 2353",
    "ORUSS LADIES DAY & DATE",
    "OLEVS LADIES WATCH",
    "NAVIFORCE GENTS WATCH #NF 9117",
    "PRO 9 GS SMART WATCH",
    "D18 SMART WATCH GS"
  ];

  for (const name of brandTestNames) {
    const extracted = extractBrand(name);
    console.log(`• "${name}" -> Extracted Brand: ${extracted}`);
  }

  // 5. Test Recommendations for New Products
  console.log("\n--- 5. TESTING RECOMMENDATIONS FOR NEW PRODUCTS ---");

  // A. Michael Kors
  const mkWatch = await prisma.product.findFirst({
    where: { name: { contains: "MICHAEL KORS", mode: "insensitive" } },
    include: { category: true }
  });
  if (mkWatch) {
    const related = await getRelatedProducts(mkWatch.id, 4);
    console.log(`\nRecommendations for "${mkWatch.name}" (Category: ${mkWatch.category.name}, Price: KES ${mkWatch.price}):`);
    related.forEach((r, i) => {
      console.log(`  [${i + 1}] ${r.name} - KES ${r.price} (${r.category?.name})`);
    });
  }

  // B. Poedagar
  const poedagarWatch = await prisma.product.findFirst({
    where: { name: { contains: "POEDAGAR GENTS WATCH", mode: "insensitive" } },
    include: { category: true }
  });
  if (poedagarWatch) {
    const related = await getRelatedProducts(poedagarWatch.id, 4);
    console.log(`\nRecommendations for "${poedagarWatch.name}" (Category: ${poedagarWatch.category.name}, Price: KES ${poedagarWatch.price}):`);
    related.forEach((r, i) => {
      console.log(`  [${i + 1}] ${r.name} - KES ${r.price} (${r.category?.name})`);
    });
  }

  // C. OPK Couple Watch
  const opkWatch = await prisma.product.findFirst({
    where: { name: { contains: "OPK COUPLE WATCH", mode: "insensitive" } },
    include: { category: true }
  });
  if (opkWatch) {
    const related = await getRelatedProducts(opkWatch.id, 4);
    console.log(`\nRecommendations for "${opkWatch.name}" (Category: ${opkWatch.category.name}, Price: KES ${opkWatch.price}):`);
    related.forEach((r, i) => {
      console.log(`  [${i + 1}] ${r.name} - KES ${r.price} (${r.category?.name})`);
    });
  }

  // 6. Test Smart Search Integration
  console.log("\n--- 6. TESTING SMART SEARCH INTEGRATION ---");

  // Query: "Poedagar"
  const searchPoedagar = await getSmartSearchResults("Poedagar", 6);
  console.log(`\nSearch "Poedagar": Found ${searchPoedagar.exactMatches.length} exact matches (isFallback: ${searchPoedagar.isFallback})`);
  searchPoedagar.exactMatches.forEach((m) => console.log(`  • ${m.name} (KES ${m.price})`));

  // Query: "Michael Kors"
  const searchMK = await getSmartSearchResults("Michael Kors", 6);
  console.log(`\nSearch "Michael Kors": Found ${searchMK.exactMatches.length} exact matches`);
  searchMK.exactMatches.forEach((m) => console.log(`  • ${m.name} (KES ${m.price})`));

  // Query: "OPK"
  const searchOPK = await getSmartSearchResults("OPK", 6);
  console.log(`\nSearch "OPK": Found ${searchOPK.exactMatches.length} exact matches`);
  searchOPK.exactMatches.forEach((m) => console.log(`  • ${m.name} (KES ${m.price})`));

  // Query: "watch" (broad query should return a blend of old and new catalog)
  const searchWatch = await getSmartSearchResults("watch", 8);
  console.log(`\nSearch "watch": Found ${searchWatch.exactMatches.length} exact matches`);
  searchWatch.exactMatches.slice(0, 6).forEach((m) => console.log(`  • ${m.name} - KES ${m.price} (${m.category?.name})`));

  // 7. Verify Inactive Products Are Excluded
  console.log("\n--- 7. INACTIVE PRODUCTS STOREFRONT ISOLATION CHECK ---");
  const inactives = await prisma.product.findMany({
    where: { isActive: false },
    select: { id: true, name: true, slug: true, statusNote: true }
  });
  console.log(`Total Inactive Products: ${inactives.length}`);
  inactives.forEach((item) => {
    console.log(`  - "${item.name}" (Slug: ${item.slug}, Note: "${item.statusNote}")`);
  });

  const searchCheckInactive = await getSmartSearchResults("TWIN BOX", 6);
  const foundInactiveInSearch = searchCheckInactive.exactMatches.some((m) => m.name.includes("TWIN BOX"));
  console.log(`Assert: Inactive items excluded from search: ${!foundInactiveInSearch ? "PASSED" : "FAILED"}`);

  console.log("\n=====================================================================");
  console.log("INTEGRATION VERIFICATION COMPLETE");
  console.log("=====================================================================");
}

verifyIntegration()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
