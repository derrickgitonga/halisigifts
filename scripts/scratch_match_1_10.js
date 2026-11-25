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

rawProducts.slice(0, 10).forEach((p, idx) => {
  let header = p.header;
  let name = header.replace(/(?:kes|ksh)\s*[\d,]+.*$/i, '').trim();
  console.log(`[${idx + 1}] "${name}"`);
  const matched = productFiles.filter(f => {
    return f.toLowerCase().includes(name.toLowerCase().split(' ')[0]);
  });
  console.log(`    Matched (${matched.length}):`, matched);
});
