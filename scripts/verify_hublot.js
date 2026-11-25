const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHublot() {
  const product = await prisma.product.findFirst({
    where: { name: { contains: 'Hublot', mode: 'insensitive' } },
    include: { category: true, variants: true }
  });

  if (!product) {
    console.log('Hublot not found');
    return;
  }

  console.log('\n--- HUBLOT PRODUCT STORED RECORD ---');
  console.log('Name:       ', product.name);
  console.log('SKU:        ', product.sku);
  console.log('Category:   ', product.category.name);
  console.log('Price:      ', 'KES ' + Number(product.price).toLocaleString());
  console.log('Parent Stock (sum):', product.stock);
  console.log('Total Product Images:', product.images.length);
  console.log('Variants (' + product.variants.length + '):');
  product.variants.forEach(v => {
    console.log(`  - ${v.name.padEnd(20)} [SKU: ${v.sku.padEnd(22)}] [Stock: ${v.stock}] Image: ${v.image}`);
  });
}

checkHublot().finally(async () => {
  await prisma.$disconnect();
});
