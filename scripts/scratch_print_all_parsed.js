const fs = require('fs');

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

console.log(`TOTAL PRODUCTS IN product.docx: ${rawProducts.length}`);
rawProducts.forEach((p, idx) => {
  console.log(`\n--- [${idx + 1}] ---`);
  console.log(`Header: ${p.header}`);
  console.log(`Lines (${p.lines.length}):`);
  p.lines.forEach(l => console.log(`  - ${l}`));
});
