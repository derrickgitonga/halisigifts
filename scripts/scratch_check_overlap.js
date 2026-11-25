const fs = require('fs');

const f1 = fs.readdirSync('public/product');
const f2 = fs.readdirSync('public/PRODUCTSs');

console.log('Total in public/product:', f1.length);
console.log('Total in public/PRODUCTSs:', f2.length);

const overlap = f1.filter(x => f2.includes(x));
console.log('Exact filename overlap:', overlap.length);

// Check if any product images exist in public/products (lowercase destination)
const fDest = fs.readdirSync('public/products');
console.log('Total in destination public/products:', fDest.length);
