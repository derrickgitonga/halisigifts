const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectBatch2() {
  const batch2Slugs = [
    'michael-kors-mk-chronograph',
    'lige-lg8963a',
    'daniel-wellington',
    'opk-couple-watch',
    'poedagar-gents',
    'casio-digital',
    'ochstin-chronograph-gents-watch',
    'curren-gents-8301',
    'school-digital-casio',
    'oruss-ladies-day-and-date',
    'casio-unisex',
    'olevs-ladies-watch',
    'naviforce-gents-watch-nf-9117',
    'pro-9-gs-smart-watch',
    'daniel-wellington-ladies-watch-x-bracelet',
    'twin-box-available',
    '3-in-1-detachable-ladies-necklace',
    'curren-gents-watch-8365',
    'curren-branded-box',
    '3-in-1-olevs-gift-set',
    'naviforce-nf8051',
    'opk-gents-watch-8152',
    'poedagar-gents-watch',
    'd18-smart-watch-gs',
    '4pc-matching-jewellery-sets-1600',
    '4-pc-matching-jewellery-sets-1400',
    'skmei-men-digital-2353',
    'oruss-men-date-watch',
    'curren-ladies-9051',
    'opk-gents-watch-8172',
    'elegant-matching-jewellery-sets'
  ];

  const products = await prisma.product.findMany({
    where: { slug: { in: batch2Slugs } },
    include: { category: true, variants: true }
  });

  console.log(`Found ${products.length} batch 2 products in DB:\n`);
  products.forEach((p, idx) => {
    console.log(`[${idx + 1}] ${p.name.padEnd(42)} | Slug: ${p.slug.padEnd(40)} | SKU: ${p.sku.padEnd(12)} | Category: ${p.category.name.padEnd(25)} (${p.category.slug}) | Active: ${p.isActive} | Variants: ${p.variants.length} | Images: ${p.images.length}`);
  });

  await prisma.$disconnect();
}

inspectBatch2();
