import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== COMPREHENSIVE DATABASE IMPORT VERIFICATION ===\n");

  const productCount = await prisma.product.count();
  const variantCount = await prisma.productVariant.count();
  const categoryCount = await prisma.category.count();

  console.log(`Total Categories: ${categoryCount}`);
  console.log(`Total Products: ${productCount}`);
  console.log(`Total Variants: ${variantCount}\n`);

  // 1. Category breakdown
  console.log("--- Products per Category ---");
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" }
  });
  categories.forEach((c) => {
    console.log(`• ${c.name} (${c.slug}): ${c._count.products} products`);
  });

  // 2. Spot check items
  console.log("\n--- Spot Checking Key Items ---");

  // A. Wooden Executive Boxes
  const woodenBox = await prisma.product.findUnique({
    where: { slug: "wooden-executive-boxes" },
    include: { category: true, variants: true }
  });
  console.log("\n[1] Wooden Executive Boxes:");
  console.log({
    name: woodenBox?.name,
    price: Number(woodenBox?.price),
    priceMin: woodenBox?.priceMin,
    priceMax: woodenBox?.priceMax,
    category: woodenBox?.category.name,
    images: woodenBox?.images,
    variantsCount: woodenBox?.variants.length,
    descriptionPreview: woodenBox?.description.substring(0, 120) + "..."
  });

  // B. Curren Ladies #9097 (In-body colour list)
  const curren9097 = await prisma.product.findUnique({
    where: { slug: "curren-ladies-9097-metallic" },
    include: { category: true, variants: true }
  });
  console.log("\n[2] Curren Ladies #9097 (Colour Variants):");
  console.log({
    name: curren9097?.name,
    price: Number(curren9097?.price),
    category: curren9097?.category.name,
    imagesCount: curren9097?.images.length,
    variants: curren9097?.variants.map((v) => ({ name: v.name, sku: v.sku, image: v.image, modifier: Number(v.priceModifier) }))
  });

  // C. Casio Square (Dual-pricing pair)
  const casioSquare = await prisma.product.findUnique({
    where: { slug: "casio-square" },
    include: { category: true, variants: true }
  });
  console.log("\n[3] Casio Square (Dual Pricing):");
  console.log({
    name: casioSquare?.name,
    price: Number(casioSquare?.price),
    priceMin: Number(casioSquare?.priceMin),
    priceMax: Number(casioSquare?.priceMax),
    category: casioSquare?.category.name,
    variants: casioSquare?.variants.map((v) => ({ name: v.name, sku: v.sku, modifier: Number(v.priceModifier) }))
  });

  // D. Valentines Men Gift Set
  const valMen = await prisma.product.findUnique({
    where: { slug: "valentines-men-gift-set" },
    include: { category: true, variants: true }
  });
  console.log("\n[4] Valentines Men Gift Set:");
  console.log({
    name: valMen?.name,
    price: Number(valMen?.price),
    category: valMen?.category.name,
    images: valMen?.images
  });

  // E. Perfume - Amber Oud
  const amberOud = await prisma.product.findUnique({
    where: { slug: "amber-oud-by-haramain-perfumes" },
    include: { category: true, variants: true }
  });
  console.log("\n[5] Perfume - Amber Oud:");
  console.log({
    name: amberOud?.name,
    price: Number(amberOud?.price),
    category: amberOud?.category.name,
    images: amberOud?.images,
    variants: amberOud?.variants.map((v) => ({ name: v.name, image: v.image }))
  });

  // F. Unmatched Item - Curren Gents #8403
  const curren8403 = await prisma.product.findUnique({
    where: { slug: "curren-gents-8403" },
    include: { category: true }
  });
  console.log("\n[6] Unmatched Item - Curren Gents #8403:");
  console.log({
    name: curren8403?.name,
    price: Number(curren8403?.price),
    category: curren8403?.category.name,
    images: curren8403?.images,
    isActive: curren8403?.isActive,
    statusNote: curren8403?.statusNote
  });

  // 3. Verify all image URLs in the entire database
  const allProducts = await prisma.product.findMany({ select: { id: true, name: true, images: true } });
  let invalidImages = 0;
  for (const p of allProducts) {
    for (const img of p.images) {
      if (!img.startsWith("/products/") || img.includes("PRODUCTSs") || img !== img.toLowerCase()) {
        console.warn(`Invalid/mixed-case image found: ${img} on ${p.name}`);
        invalidImages++;
      }
    }
  }
  console.log(`\nImage URL validation check: ${invalidImages === 0 ? "PASSED (100% lowercase /products/ paths)" : "FAILED"}`);

  // 4. Test Digital Watches query
  const digitalKeywords = ["dual time", "worldtime", "world time", "azan", "digital", "illuminator", "led", "world-time", "g shock"];
  const digitalMatches = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { category: { slug: "digital-watches" } },
        ...digitalKeywords.map((kw) => ({ name: { contains: kw, mode: "insensitive" as const } })),
        ...digitalKeywords.map((kw) => ({ description: { contains: kw, mode: "insensitive" as const } }))
      ],
      NOT: { category: { slug: "smart-watches" } }
    }
  });
  console.log(`\nDigital Watches query match count: ${digitalMatches.length} items`);
  digitalMatches.forEach((dm) => console.log(`  • ${dm.name} (KES ${dm.price})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
