const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectWorkspace() {
  console.log('=== Image Folders Check ===');
  const dirs = ['public/PRODUCTS', 'public/PRODUCTSs', 'public/product', 'public/products'];
  dirs.forEach(d => {
    if (fs.existsSync(d)) {
      const files = fs.readdirSync(d);
      console.log(`Directory ${d}: ${files.length} items`);
      console.log(`Sample files in ${d}:`, files.slice(0, 5));
    } else {
      console.log(`Directory ${d}: NOT FOUND`);
    }
  });

  console.log('\n=== Docx Extraction Check ===');
  if (fs.existsSync('temp_docx_product/word/document.xml')) {
    const xml = fs.readFileSync('temp_docx_product/word/document.xml', 'utf8');
    const pMatches = xml.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) || [];
    const paragraphs = [];
    for (const p of pMatches) {
      const tMatches = p.match(/<w:t[\s>][\s\S]*?<\/w:t>/g) || [];
      const text = tMatches.map(t => t.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '')).join('');
      if (text.trim()) {
        paragraphs.push(text.trim());
      }
    }
    console.log(`Parsed ${paragraphs.length} non-empty paragraphs from product.docx`);
    console.log(`First 10 paragraphs:`);
    paragraphs.slice(0, 10).forEach((p, idx) => console.log(`  [${idx + 1}] ${p}`));
    fs.writeFileSync('scratch_product_paragraphs.json', JSON.stringify(paragraphs, null, 2));
  }

  console.log('\n=== DB Summary ===');
  const catCount = await prisma.category.count();
  const prodCount = await prisma.product.count();
  const varCount = await prisma.productVariant.count();
  console.log(`Current DB totals: ${catCount} categories, ${prodCount} products, ${varCount} variants`);

  const prods = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, sku: true, images: true, category: { select: { slug: true } } }
  });
  console.log(`Sample DB product names:`, prods.slice(0, 10).map(p => `${p.name} (${p.category.slug})`));

  await prisma.$disconnect();
}

inspectWorkspace().catch(console.error);
