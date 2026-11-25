import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

export async function backupAdminProducts() {
  const backupPath = path.join(process.cwd(), "data", "admin_products_backup.json");
  const dataDir = path.dirname(backupPath);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Find all products that are NOT catalog SKUs (not starting with MWB-) or custom products
  const adminProducts = await prisma.product.findMany({
    where: {
      NOT: {
        sku: { startsWith: "MWB-" },
      },
    },
    include: {
      category: { select: { slug: true, name: true } },
      variants: true,
    },
  });

  if (adminProducts.length > 0) {
    let existing: any[] = [];
    if (fs.existsSync(backupPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(backupPath, "utf8"));
      } catch {
        existing = [];
      }
    }

    const mergedMap = new Map<string, any>();
    existing.forEach((p) => mergedMap.set(p.sku || p.slug, p));
    adminProducts.forEach((p) => mergedMap.set(p.sku || p.slug, p));

    const finalBackup = Array.from(mergedMap.values());
    fs.writeFileSync(backupPath, JSON.stringify(finalBackup, null, 2));
    console.log(`Backed up ${adminProducts.length} admin-added products to ${backupPath} (Total saved: ${finalBackup.length})`);
    return finalBackup;
  } else {
    console.log("No non-catalog admin products found to backup.");
    return [];
  }
}

if (require.main === module) {
  backupAdminProducts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
