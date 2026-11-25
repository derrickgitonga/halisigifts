const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSkus() {
  const products = await prisma.product.findMany({
    select: { sku: true, category: { select: { slug: true } } }
  });

  const skuMap = {};
  products.forEach(p => {
    const parts = p.sku.split('-');
    if (parts.length >= 3) {
      const prefix = parts[1];
      const num = parseInt(parts[2], 10);
      if (!skuMap[prefix] || num > skuMap[prefix]) {
        skuMap[prefix] = num;
      }
    }
  });

  console.log('=== Max SKU Numbers per Prefix ===');
  Object.keys(skuMap).sort().forEach(k => {
    console.log(`Prefix ${k}: Max number = ${skuMap[k]}`);
  });

  await prisma.$disconnect();
}
checkSkus();
