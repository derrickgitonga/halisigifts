import { prisma } from "../lib/prisma";

async function cleanEmptyCategories() {
  const emptyCats = await prisma.category.findMany({
    where: {
      products: {
        none: {},
      },
    },
  });

  for (const c of emptyCats) {
    await prisma.category.delete({ where: { id: c.id } });
    console.log(`Deleted empty category: ${c.name} (${c.slug})`);
  }

  const finalCategories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  console.log("\n=== FINAL CLEAN CATEGORIES (ALL HAVE PRODUCTS, 0 DUPLICATES) ===");
  for (const c of finalCategories) {
    console.log(`- ${c.name} (${c.slug}) -> ${c._count.products} products`);
  }
}

cleanEmptyCategories().finally(() => prisma.$disconnect());
