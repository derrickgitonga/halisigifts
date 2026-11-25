import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NAV_CATEGORIES = [
  { slug: "watches-men-analogue", navOrder: 1, navLabel: "Analogue" },
  { slug: "watches-men-digital", navOrder: 2, navLabel: "Digital" },
  { slug: "smart-watches", navOrder: 3, navLabel: "Smart Watches" },
  { slug: "accessories-gift-boxes", navOrder: 4, navLabel: "Gifts & Accessories" },
];

async function main() {
  for (const { slug, navOrder, navLabel } of NAV_CATEGORIES) {
    const result = await prisma.category.updateMany({
      where: { slug },
      data: { showInNav: true, navOrder, navLabel },
    });
    if (result.count > 0) {
      console.log(`Set showInNav=true navOrder=${navOrder} navLabel="${navLabel}" for slug: ${slug}`);
    } else {
      console.warn(`No category found for slug: ${slug}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
