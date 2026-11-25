const fs = require('fs');
const path = require('path');

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

const productFiles = fs.readdirSync('public/product');
const productsFiles = fs.readdirSync('public/PRODUCTSs');

console.log('=== MATCHING 31 PRODUCTS TO IMAGES ===\n');

rawProducts.forEach((p, idx) => {
  let header = p.header;
  let priceMatch = header.match(/(?:kes|ksh)\s*([\d,]+)/i);
  let price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;
  let name = header.replace(/(?:kes|ksh)\s*[\d,]+.*$/i, '').trim();

  // Find matching images in public/product
  const pClean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchedInProduct = productFiles.filter(f => {
    const fClean = path.basename(f, path.extname(f)).toLowerCase().replace(/[^a-z0-9]/g, '');
    return fClean.includes(pClean) || pClean.includes(fClean.substring(0, 8));
  });

  console.log(`[${idx + 1}] "${name}" (Price: KES ${price})`);
  console.log(`    Matched in public/product (${matchedInProduct.length}):`);
  matchedInProduct.forEach(m => console.log(`      - ${m}`));

  // Check if any matched in public/PRODUCTSs as well
  const matchedInPRODUCTSs = productsFiles.filter(f => {
    const fClean = path.basename(f, path.extname(f)).toLowerCase().replace(/[^a-z0-9]/g, '');
    return fClean.includes(pClean) || pClean.includes(fClean.substring(0, 8));
  });
  if (matchedInPRODUCTSs.length > 0) {
    console.log(`    Matched in public/PRODUCTSs (${matchedInPRODUCTSs.length}):`);
    matchedInPRODUCTSs.forEach(m => console.log(`      - ${m}`));
  }
  console.log('');
});
