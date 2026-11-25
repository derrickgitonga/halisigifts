const fs = require('fs');
const parsed = JSON.parse(fs.readFileSync('temp_docx/parsed_products_full.json', 'utf8'));

console.log('=== FULL LIST OF PRODUCTS IN MENS WATCHES (46 total) ===');
const mens = parsed.filter(p => p.category.slug === 'mens-watches');
mens.forEach((p, i) => {
  const priceDisplay = p.priceMin ? `KES ${p.priceMin} - ${p.priceMax}` : (p.price ? `KES ${p.price}` : 'PENDING REVIEW');
  console.log(`${i + 1}. ${p.name} [${priceDisplay}] (Variants: ${p.variants.length})`);
});

console.log('\n=== FULL LIST OF PRODUCTS IN GIFT PACKS & SETS (8 total) ===');
const gifts = parsed.filter(p => p.category.slug === 'gift-packs-sets');
gifts.forEach((p, i) => {
  console.log(`${i + 1}. ${p.name} [KES ${p.price}]`);
});

console.log('\n=== COMPLETE SUMMARY OF ALL CATEGORIES (113 total products) ===');
const allCats = {};
parsed.forEach(p => {
  allCats[p.category.name] = (allCats[p.category.name] || 0) + 1;
});
Object.entries(allCats).forEach(([cat, count]) => {
  console.log(`${cat}: ${count} products`);
});
