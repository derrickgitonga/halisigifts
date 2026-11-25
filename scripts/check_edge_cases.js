const fs = require('fs');
const parsedProducts = JSON.parse(fs.readFileSync('temp_docx/parsed_products_full.json', 'utf8'));

const edgeCaseNames = [
  'Seiko 5 Couple Watches',
  'Wooden Executive Watch Organizers',
  'Executive AAA Quality Watches',
  'Ochstin Chronograph Gents Watch #6132',
  'Golden Hour Gents Watch'
];

const edgeCases = parsedProducts.filter(p => edgeCaseNames.includes(p.name));
console.log('Found edge cases in parsed dataset:', edgeCases.length);
edgeCases.forEach(p => {
  console.log('\n- Product:', p.name);
  console.log('  Category:', p.category.name);
  console.log('  Base Price:', p.price);
  console.log('  Price Range:', p.priceMin, 'to', p.priceMax);
  console.log('  Status Note:', p.statusNote);
  console.log('  Variants:', JSON.stringify(p.variants));
  console.log('  Images:', p.images.length);
});
