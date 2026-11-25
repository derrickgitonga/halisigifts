import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

export async function restoreAdminProducts() {
  const backupPath = path.join(process.cwd(), "data", "admin_products_backup.json");

  if (!fs.existsSync(backupPath)) {
    console.log("No admin_products_backup.json file found to restore.");
    return { restoredCount: 0 };
  }

  let adminProducts: any[] = [];
  try {
    adminProducts = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  } catch {
    console.log("Error reading admin_products_backup.json file.");
    return { restoredCount: 0 };
  }

  if (adminProducts.length === 0) {
    console.log("Admin products backup file is empty.");
    return { restoredCount: 0 };
  }

  let restoredCount = 0;

  for (const item of adminProducts) {
    let catSlug = item.category?.slug || "watches-men";
    let category = await prisma.category.findUnique({ where: { slug: catSlug } });

    if (!category) {
      category = await prisma.category.findFirst();
    }

    if (!category) {
      console.log(`Skipping product ${item.name}: No valid category found.`);
      continue;
    }

    const productRecord = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        slug: item.slug,
        description: item.description || "",
        price: item.price,
        compareAtPrice: item.compareAtPrice,
        priceMin: item.priceMin,
        priceMax: item.priceMax,
        categoryId: category.id,
        images: item.images || [],
        stock: item.stock || 0,
        isNew: Boolean(item.isNew),
        isFeatured: Boolean(item.isFeatured),
        isHotDeal: Boolean(item.isHotDeal),
        isActive: Boolean(item.isActive),
        statusNote: item.statusNote,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description || "",
        price: item.price,
        compareAtPrice: item.compareAtPrice,
        priceMin: item.priceMin,
        priceMax: item.priceMax,
        categoryId: category.id,
        images: item.images || [],
        stock: item.stock || 0,
        sku: item.sku,
        isNew: Boolean(item.isNew),
        isFeatured: Boolean(item.isFeatured),
        isHotDeal: Boolean(item.isHotDeal),
        isActive: Boolean(item.isActive),
        statusNote: item.statusNote,
      },
    });

    if (item.variants && item.variants.length > 0) {
      for (const v of item.variants) {
        await prisma.productVariant.upsert({
          where: { sku: v.sku },
          update: {
            name: v.name,
            image: v.image,
            priceModifier: v.priceModifier,
            stock: v.stock,
          },
          create: {
            productId: productRecord.id,
            name: v.name,
            image: v.image,
            priceModifier: v.priceModifier,
            stock: v.stock,
            sku: v.sku,
          },
        });
      }
    }

    restoredCount++;
  }

  console.log(`Successfully restored ${restoredCount} admin products to database.`);
  return { restoredCount };
}

if (require.main === module) {
  restoreAdminProducts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
