const fs = require('fs');
const path = require('path');

const paragraphs = JSON.parse(fs.readFileSync('scratch_product_paragraphs.json', 'utf8'));

console.log(`Total paragraphs in product.docx: ${paragraphs.length}`);

// Let's inspect all lines to see all product headers
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
    current = { header: line, lines: [], index: i };
  } else {
    if (current) {
      current.lines.push(line);
    } else {
      console.log('Unattached header line:', line);
    }
  }
}
if (current) rawProducts.push(current);

console.log(`\nParsed ${rawProducts.length} product blocks from product.docx:\n`);

rawProducts.forEach((p, idx) => {
  console.log(`[${idx + 1}] Header: "${p.header}"`);
  console.log(`    Lines (${p.lines.length}): ${p.lines.join(' | ')}`);
});

// Check image directories
const productImages = fs.existsSync('public/product') ? fs.readdirSync('public/product') : [];
const productsImages = fs.existsSync('public/PRODUCTSs') ? fs.readdirSync('public/PRODUCTSs') : [];

console.log('\n--- public/product files (total ' + productImages.length + ') ---');
console.log(productImages);

console.log('\n--- public/PRODUCTSs files (total ' + productsImages.length + ') ---');
console.log(productsImages);
