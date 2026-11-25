import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

async function exportCatalog() {
  console.log("Exporting catalog from local database...");

  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany({
    include: {
      variants: true,
    },
  });

  const payload = {
    timestamp: new Date().toISOString(),
    totalCategories: categories.length,
    totalProducts: products.length,
    categories,
    products,
  };

  const outDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, "catalog_dump.json");
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf-8");

  console.log(`Exported ${categories.length} categories and ${products.length} products to ${outFile}`);
}

exportCatalog()
  .catch((e) => {
    console.error("Export error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
