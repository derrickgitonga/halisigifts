const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showCategories() {
  const cats = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } }
    },
    orderBy: { slug: 'asc' }
  });

  console.log('=== All Categories in DB ===');
  cats.forEach(c => {
    console.log(`- ${c.name.padEnd(30)} slug: ${c.slug.padEnd(25)} products: ${c._count.products}`);
  });

  await prisma.$disconnect();
}

showCategories();
