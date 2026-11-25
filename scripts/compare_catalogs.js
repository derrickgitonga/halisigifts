const fs = require('fs');
const path = require('path');

const cat1 = JSON.parse(fs.readFileSync('temp_docx/parsed_products_full.json', 'utf8'));
const cat2 = JSON.parse(fs.readFileSync('temp_docx/final_matched_products.json', 'utf8'));

console.log('Catalog 1 (product details.docx) count:', cat1.length);
console.log('Catalog 2 (productss.docx) count:', cat2.length);

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/['’]/g, '')
    .replace(/[#*(),]/g, ' ')
    .replace(/kes\s*[\d,]+/g, '')
    .replace(/ksh\s*[\d,]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const cat1Map = new Map();
cat1.forEach(p => {
  const norm = normalize(p.name);
  cat1Map.set(norm, p);
});

const overlap = [];
const uniqueInCat2 = [];

cat2.forEach(p => {
  const norm = normalize(p.name);
  if (cat1Map.has(norm)) {
    overlap.push({ cat1Name: cat1Map.get(norm).name, cat2Name: p.name });
  } else {
    uniqueInCat2.push(p);
  }
});

console.log(`\nOverlapping products: ${overlap.length}`);
console.log(`Unique in Catalog 2 (new additions): ${uniqueInCat2.length}`);
console.log(`Total Unified Products: ${cat1.length + uniqueInCat2.length}`);

console.log('\nSample overlaps:');
overlap.slice(0, 10).forEach(o => console.log(`• [Cat1] ${o.cat1Name} <-> [Cat2] ${o.cat2Name}`));

console.log('\nSample unique in Catalog 2:');
uniqueInCat2.slice(0, 10).forEach(u => console.log(`• ${u.name} (KES ${u.price}) [${u.category.name}]`));
