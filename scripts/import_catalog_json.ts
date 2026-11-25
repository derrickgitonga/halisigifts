import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

async function importCatalog() {
  const filePath = path.join(process.cwd(), "data", "catalog_dump.json");
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  console.log(`Starting import of ${data.categories.length} categories and ${data.products.length} products...`);

  // 1. Upsert categories
  const categoryIdMap: Record<string, string> = {};
  for (const cat of data.categories) {
    const upserted = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        image: cat.image,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
      },
    });
    categoryIdMap[cat.id] = upserted.id;
  }
  console.log(`Synchronized ${data.categories.length} categories.`);

  // 2. Upsert products and variants
  let inserted = 0;
  let updated = 0;

  for (const prod of data.products) {
    const targetCategoryId = categoryIdMap[prod.categoryId] || prod.categoryId;

    const existing = await prisma.product.findUnique({
      where: { slug: prod.slug },
    });

    const productData = {
      name: prod.name,
      slug: prod.slug,
      description: prod.description,
      price: prod.price,
      compareAtPrice: prod.compareAtPrice || null,
      priceMin: prod.priceMin || null,
      priceMax: prod.priceMax || null,
      images: prod.images,
      category: { connect: { id: targetCategoryId } },
      sku: prod.sku,
      stock: prod.stock || 0,
      isActive: prod.isActive ?? true,
      isFeatured: prod.isFeatured ?? false,
      isNew: prod.isNew ?? false,
      isHotDeal: prod.isHotDeal ?? false,
      statusNote: prod.statusNote || null,
    };

    let savedProductId: string;

    if (existing) {
      const up = await prisma.product.update({
        where: { slug: prod.slug },
        data: productData,
      });
      savedProductId = up.id;
      updated++;
    } else {
      const cr = await prisma.product.create({
        data: {
          id: prod.id,
          ...productData,
        },
      });
      savedProductId = cr.id;
      inserted++;
    }

    // Upsert variants
    if (prod.variants && prod.variants.length > 0) {
      for (const v of prod.variants) {
        const variantData = {
          name: v.name,
          sku: v.sku,
          image: v.image || null,
          priceModifier: v.priceModifier || 0,
          stock: v.stock || 0,
        };

        const existingBySku = await prisma.productVariant.findUnique({
          where: { sku: v.sku },
        });

        if (existingBySku) {
          await prisma.productVariant.update({
            where: { id: existingBySku.id },
            data: {
              ...variantData,
              productId: savedProductId,
            },
          });
        } else {
          await prisma.productVariant.create({
            data: {
              id: v.id,
              productId: savedProductId,
              ...variantData,
            },
          });
        }
      }
    }
  }

  const finalTotal = await prisma.product.count();
  console.log(`Import completed: ${inserted} created, ${updated} updated. Total in database: ${finalTotal}`);
}

importCatalog()
  .catch((e) => {
    console.error("Import error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
