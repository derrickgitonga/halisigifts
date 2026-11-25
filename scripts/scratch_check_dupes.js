const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function checkDuplicates() {
  const paragraphs = JSON.parse(fs.readFileSync('scratch_product_paragraphs.json', 'utf8'));

  function isProductHeader(line) {
    if (/(?:kes|ksh)\s*[\d,]+/i.test(line)) {
      if (/brand labels/i.test(line) && /sticker/i.test(line)) return false;
      return true;
    }
    return false;
  }

  const rawProducts = [];
  let current = null;

  for (let i = 0; i < paragraphs.length; i++) {
    const line = paragraphs[i].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    if (!line) continue;

    if (isProductHeader(line)) {
      if (current) rawProducts.push(current);
      current = { header: line, lines: [] };
    } else {
      if (current) {
        current.lines.push(line);
      }
    }
  }
  if (current) rawProducts.push(current);

  const existingProducts = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, price: true, sku: true }
  });

  console.log('=== Checking 31 new products against DB existing products ===');
  let duplicateCount = 0;
  let newCount = 0;

  for (const rp of rawProducts) {
    const header = rp.header;
    const name = header.replace(/(?:kes|ksh)\s*[\d,]+.*$/i, '').trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const found = existingProducts.find(ep => 
      ep.name.toLowerCase() === name.toLowerCase() || 
      ep.slug.toLowerCase() === slug.toLowerCase()
    );

    if (found) {
      console.log(`[EXISTS] "${name}" matches DB product "${found.name}" (slug: ${found.slug}, sku: ${found.sku})`);
      duplicateCount++;
    } else {
      console.log(`[NEW]    "${name}" (slug: ${slug})`);
      newCount++;
    }
  }

  console.log(`\nSummary: ${newCount} new products, ${duplicateCount} already in DB`);
  await prisma.$disconnect();
}

checkDuplicates();
