import { prisma } from "../lib/prisma";

async function migrateWatchCategories() {
  const catDefs = [
    {
      name: "Men's Watches - Analogue",
      slug: "watches-men-analogue",
      description: "Men's luxury analogue, chronograph, quartz and skeleton timepieces.",
      image: "/products/hublot-automatic-gents-watch-blue.jpg",
    },
    {
      name: "Men's Watches - Digital",
      slug: "watches-men-digital",
      description: "Men's multi-function digital, dual-time, vintage LED and world-time watches.",
      image: "/products/casio-worldtime-(ae-1200wh).jpg",
    },
    {
      name: "Ladies' Watches - Analogue",
      slug: "watches-ladies-analogue",
      description: "Ladies' elegant analogue, metallic bracelet, and iced luxury watches.",
      image: "/products/curren-ladies-9097-metallic-gold-white.jpg",
    },
    {
      name: "Ladies' Watches - Digital",
      slug: "watches-ladies-digital",
      description: "Ladies' stylish digital, vintage retro and dual-time watches.",
      image: "/products/casio-vintage-digital-watch-(gold).jpg",
    },
  ];

  const createdCats: Record<string, { id: string; name: string; slug: string }> = {};
  for (const c of catDefs) {
    const record = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: c,
    });
    createdCats[c.slug] = record;
  }

  const digitalKeywords = [
    "dual time",
    "worldtime",
    "world time",
    "azan",
    "digital",
    "illuminator",
    "led",
    "world-time",
    "skmei",
    "casio digital",
  ];

  function isDigital(name: string) {
    const lower = name.toLowerCase();
    return digitalKeywords.some((k) => lower.includes(k));
  }

  const allMen = await prisma.product.findMany({
    where: {
      OR: [
        { category: { slug: "watches-men" } },
        { category: { slug: "watches-men-analogue" } },
        { category: { slug: "watches-men-digital" } },
      ],
    },
    select: { id: true, name: true },
  });

  for (const p of allMen) {
    const targetSlug = isDigital(p.name) ? "watches-men-digital" : "watches-men-analogue";
    await prisma.product.update({
      where: { id: p.id },
      data: { categoryId: createdCats[targetSlug].id },
    });
  }

  const allLadies = await prisma.product.findMany({
    where: {
      OR: [
        { category: { slug: "watches-ladies" } },
        { category: { slug: "watches-ladies-analogue" } },
        { category: { slug: "watches-ladies-digital" } },
      ],
    },
    select: { id: true, name: true },
  });

  for (const p of allLadies) {
    const targetSlug = isDigital(p.name) ? "watches-ladies-digital" : "watches-ladies-analogue";
    await prisma.product.update({
      where: { id: p.id },
      data: { categoryId: createdCats[targetSlug].id },
    });
  }

  // Also clean up redundant empty parent categories
  const oldMen = await prisma.category.findUnique({
    where: { slug: "watches-men" },
    include: { _count: { select: { products: true } } },
  });
  if (oldMen && oldMen._count.products === 0) {
    await prisma.category.delete({ where: { slug: "watches-men" } });
  }

  const oldLadies = await prisma.category.findUnique({
    where: { slug: "watches-ladies" },
    include: { _count: { select: { products: true } } },
  });
  if (oldLadies && oldLadies._count.products === 0) {
    await prisma.category.delete({ where: { slug: "watches-ladies" } });
  }

  // Remove empty Analogue Watches / Digital Watches / Gifts & Accessories placeholders if empty
  for (const emptySlug of ["analogue-watches", "digital-watches", "gifts-accessories"]) {
    const cat = await prisma.category.findUnique({
      where: { slug: emptySlug },
      include: { _count: { select: { products: true } } },
    });
    if (cat && cat._count.products === 0) {
      await prisma.category.delete({ where: { slug: emptySlug } });
    }
  }

  const finalCategories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  console.log("\n=== CATEGORIES AFTER SEPARATING ANALOGUE & DIGITAL ===");
  for (const c of finalCategories) {
    console.log(`- ${c.name} (${c.slug}) -> ${c._count.products} products`);
  }
}

migrateWatchCategories().finally(() => prisma.$disconnect());
