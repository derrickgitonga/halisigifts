const fs = require('fs');
const path = require('path');

// 1. Read all files in public/PRODUCTS
const productsDir = path.join(process.cwd(), 'public', 'PRODUCTS');
const imageFiles = fs.readdirSync(productsDir).filter(f => !fs.statSync(path.join(productsDir, f)).isDirectory());

// Normalization function as per prompt instructions:
// lowercase, strip punctuation, strip trailing (colour) tags, collapse whitespace
function stripColorSuffix(filenameWithoutExt) {
  // strip trailing parenthetical tag like (Gold), (black), (two-tone), (specs), (1), etc.
  return filenameWithoutExt.replace(/\s*\([^)]*\)\s*$/g, '').trim();
}

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}

console.log('Total image files in public/PRODUCTS:', imageFiles.length);

// Build map of normalized stripped image base name -> array of { file, originalBase, suffix }
const imageGroups = new Map();

imageFiles.forEach(file => {
  const baseWithoutExt = file.replace(/\.[^/.]+$/, '');
  const suffixMatch = baseWithoutExt.match(/\(([^)]+)\)\s*$/);
  const suffix = suffixMatch ? suffixMatch[1].trim() : null;
  const stripped = stripColorSuffix(baseWithoutExt);
  const norm = normalize(stripped);
  
  if (!imageGroups.has(norm)) {
    imageGroups.set(norm, []);
  }
  imageGroups.get(norm).push({
    file,
    baseWithoutExt,
    stripped,
    norm,
    suffix
  });
});

console.log('Total unique normalized image keys:', imageGroups.size);

// Read extracted paragraphs
const paragraphs = JSON.parse(fs.readFileSync('temp_docx/extracted_paragraphs.json', 'utf8'));

// Define all 113 product sections with their text bounds, exact raw title, and price text
const rawProductEntries = [
  { rawName: 'MEGIR CHRONOGRAPH GENTS WATCH', priceStr: 'KES 5,400', pStart: 0, pEnd: 8 },
  { rawName: 'CARTIER LADIES', priceStr: 'KES 3,000', pStart: 8, pEnd: 13 },
  { rawName: 'Spovan PR1 tactical watch', priceStr: 'Kes 4,000', pStart: 13, pEnd: 22 },
  { rawName: 'SKMEI 2361 Earth Time', priceStr: 'KES 3,400', pStart: 22, pEnd: 29 },
  { rawName: 'LADIES CURREN #9015', priceStr: 'KES 3,000', pStart: 29, pEnd: 32 },
  { rawName: 'CURREN GENTS 8375', priceStr: 'KES 3,400', pStart: 32, pEnd: 36 },
  { rawName: 'NAVIFORCE GENTS WATCH #NF 9208', priceStr: 'KES 5,200', pStart: 36, pEnd: 42 },
  { rawName: 'HUBLOT AUTOMATIC GENTS WATCH', priceStr: 'KES 7,400', pStart: 42, pEnd: 47 },
  { rawName: 'AUDEMARS PIGUET (AP) AUTOMATIC GENTS WATCH', priceStr: 'KES 7,600', pStart: 47, pEnd: 51 },
  { rawName: 'VERY HIGH QUALITY LADIES PURSE', priceStr: 'KES 1,400', pStart: 51, pEnd: 53 },
  { rawName: 'LADIES BRACELETS', priceStr: 'KES 600 EACH', pStart: 53, pEnd: 55 },
  { rawName: 'ROLEX x BRACELET', priceStr: 'KES 5,000', pStart: 55, pEnd: 59 },
  { rawName: 'PANERAI AUTOMATIC GENTS WATCH', priceStr: 'KES 11,000', pStart: 59, pEnd: 65 },
  { rawName: 'OPK GENTS WATCH #6028', priceStr: 'KES 2,800', pStart: 65, pEnd: 70 },
  { rawName: 'CURREN LADIES #9106 (METALLIC )', priceStr: 'KES 3,000', pStart: 70, pEnd: 73 },
  { rawName: 'OLEVS CHRONOGRAPH MEN WATCH', priceStr: 'KES 5,000', pStart: 73, pEnd: 81 },
  { rawName: 'NAVIFORCE LADIES #NF5013', priceStr: 'KES 3,600', pStart: 81, pEnd: 84 },
  { rawName: 'SEIKO 5 COUPLE WATCHES', priceStr: 'KES 6,000 / SINGLE PIECE KES 3,000', pStart: 84, pEnd: 90 },
  { rawName: 'CRRJU CHRONOGRAPH MESH GENTS WATCH', priceStr: 'KES 5,000', pStart: 90, pEnd: 96 },
  { rawName: 'KALOBEE SK37 -3pair straps', priceStr: 'Kes 5,600/=', pStart: 96, pEnd: 104 },
  { rawName: 'KALOBEE SK7 MINI-3pair straps', priceStr: 'Kes 6,400/=', pStart: 104, pEnd: 112 },
  { rawName: 'CHAXIGO DUAL TIME #6137', priceStr: 'Kes 3,600', pStart: 112, pEnd: 118 },
  { rawName: 'CHAXIGO DATE DISPLAY #6687', priceStr: 'Kes 3,000/=', pStart: 118, pEnd: 123 },
  { rawName: 'OPK LADIES #6005', priceStr: 'KES 2,800', pStart: 123, pEnd: 127 },
  { rawName: 'CHAXIGO DAY & DATE DISPLAY #7367', priceStr: 'Kes 3,000/=', pStart: 127, pEnd: 132 },
  { rawName: 'CHAXIGO DUAL TIME #7476', priceStr: 'Kes 4,000', pStart: 132, pEnd: 139 },
  { rawName: 'Casio Chronograph Gents watch', priceStr: 'KES 3,200', pStart: 139, pEnd: 145 },
  { rawName: '3 IN 1 HEART BOXES FOR GIFT PACKAGING', priceStr: 'KES 1,400 (for 3 boxes)', pStart: 145, pEnd: 150 },
  { rawName: 'RING HOLDER', priceStr: 'KES 1,600', pStart: 150, pEnd: 151 },
  { rawName: 'RING HOLDER X CARD X BAG', priceStr: 'KES 1,900', pStart: 151, pEnd: 152 },
  { rawName: 'RADO Jubile Couple set', priceStr: 'Kes 8,800 / single piece Kes 4,400', pStart: 152, pEnd: 159 },
  { rawName: 'LIGE GENTS WATCH LG89137', priceStr: 'KES 5,000', pStart: 159, pEnd: 164 },
  { rawName: 'COLMi P71 - Voice Calling Smartwatch', priceStr: 'Kes 5,800', pStart: 164, pEnd: 179 },
  { rawName: 'PHILIP PERSIO WATCH', priceStr: 'KES 3,600 EACH / COUPLE SET Kes 7,200', pStart: 179, pEnd: 186 },
  { rawName: 'NAVIFORCE NF5044', priceStr: 'KES 4,000', pStart: 186, pEnd: 191 },
  { rawName: 'SKMEI AZAN WATCH', priceStr: 'Kes 4,000', pStart: 191, pEnd: 197 },
  { rawName: 'Fendíors America: G9 Ultra Pro', priceStr: 'KES 3,000', pStart: 197, pEnd: 217 },
  { rawName: 'OLEVS LADIES 5608', priceStr: 'KES 3,600', pStart: 217, pEnd: 223 },
  { rawName: 'LADIES PURSES/WALLET', priceStr: 'KES 1,300', pStart: 223, pEnd: 225 },
  { rawName: 'Lige LG8932 Chronograph', priceStr: 'Kes 5,000', pStart: 225, pEnd: 231 },
  { rawName: 'I LOVE YOU NECKLACE IN *100 LANGUAGES*', priceStr: 'Kes 2,500', pStart: 231, pEnd: 234 },
  { rawName: 'SKMEI CHRONOGRAPH GENTS WATCH #2434', priceStr: 'KES 5,000', pStart: 234, pEnd: 239 },
  { rawName: 'DT900 ULTRA 9 SMART WATCH', priceStr: 'KES 4,000', pStart: 239, pEnd: 252 },
  { rawName: 'E16GS & D15 GS LADIES SMART WATCHES WITH JEWELLERY', priceStr: 'KES 4,400', pStart: 252, pEnd: 264 },
  { rawName: 'X10 ULTRA 2-GS SMART WATCH', priceStr: 'KES 4,000 (8 Interchangeable straps,earbuds & Smart watch cover)', pStart: 264, pEnd: 278 },
  { rawName: 'MEN QUALITY GIFT PACK WITH PERFUME', priceStr: 'KES 4,900', pStart: 278, pEnd: 286 },
  { rawName: 'PATEK PHILIPPE AUTOMATIC WATCH', priceStr: 'KES 20,000', pStart: 286, pEnd: 293 },
  { rawName: 'D10 ULTRA 3 SMART WATCH', priceStr: 'KES 3,200 (3 Interchangeable straps) Metallic,Silicone,Canvas)', pStart: 293, pEnd: 304 },
  { rawName: 'D21 SMART WATCH WITH EARBUDS AND 2 STRAPS', priceStr: 'KES 4,000', pStart: 304, pEnd: 322 },
  { rawName: '7 IN 1 MEN QUALITY GIFT PACK', priceStr: 'KES 4,500', pStart: 322, pEnd: 331 },
  { rawName: 'DOUFIT SERIES 10 (D28) SMART WATCH WITH EARBUDS,SMART WATCH CASE AND 7 STRAPS', priceStr: 'KES 4,000', pStart: 331, pEnd: 342 },
  { rawName: 'DT10 SMART WATCH WITH 2 INTERCHANGEABLE STRAPS', priceStr: 'KES 3,000', pStart: 342, pEnd: 353 },
  { rawName: 'PATEK PHILIPPE GENTS WATCH', priceStr: 'KES 3,000', pStart: 353, pEnd: 359 },
  { rawName: 'MEN QUALITY GIFT PACK WITH SHAVER', priceStr: 'KES 4,400', pStart: 359, pEnd: 366 },
  { rawName: 'OCHSTIN CHRONOGRAPH GENTS WATCH', priceStr: 'KES 4,400', pStart: 366, pEnd: 372 },
  { rawName: 'OCHSTIN CHRONOGRAPH GENTS WATCH #6063', priceStr: 'KES 5,000', pStart: 372, pEnd: 379 },
  { rawName: 'CASIO WORLDTIME WATCH', priceStr: 'KES 3,000', pStart: 379, pEnd: 386 },
  { rawName: 'HELEI GENTS WATCH', priceStr: 'KES 3,000', pStart: 386, pEnd: 391 },
  { rawName: 'OCHSTIN CHRONOGRAPH GENTS WATCH #6132 (leather)', priceStr: 'KES 4,400', pStart: 391, pEnd: 399 },
  { rawName: 'OCHSTIN MINIMALIST CHRONOGRAPH GENTS WATCH #6059', priceStr: 'KES 5,000', pStart: 399, pEnd: 406 },
  { rawName: 'ZEPPELIN CHRONOGRAPH GENTS WATCH', priceStr: 'KES 5,000', pStart: 406, pEnd: 411 },
  { rawName: 'OCHSTIN CHRONOGRAPH GENTS WATCH #6132 (metallic)', priceStr: 'KES 5,000', pStart: 411, pEnd: 417 },
  { rawName: 'OLEVS GENTS WATCH #6898 metallic', priceStr: 'KES 3,200', pStart: 417, pEnd: 423 },
  { rawName: 'NAVIFORCE MEN #NF9197 LEATHER', priceStr: 'KES 5,200', pStart: 423, pEnd: 430 },
  { rawName: 'EXQUISITE CRYSTAL MATCHING JEWELLERY SETS', priceStr: 'KES 1,200', pStart: 430, pEnd: 434 },
  { rawName: 'OLEVS LADIES #3699', priceStr: 'KES 3,600', pStart: 434, pEnd: 440 },
  { rawName: 'EXECUTIVE BOXES AVAILABLE', priceStr: 'KES 700 (plain box) / brand labels KES 100 per sticker', pStart: 440, pEnd: 443 },
  { rawName: 'POEDAGAR CHRONOGRAPH GENTS WATCH', priceStr: 'KES 5,000', pStart: 443, pEnd: 449 },
  { rawName: 'OPK GENTS WATCH #6017', priceStr: 'KES 2,800', pStart: 449, pEnd: 455 },
  { rawName: 'OPK GENTS CHRONOGRAPH WATCH #8142', priceStr: 'KES 4,000', pStart: 455, pEnd: 461 },
  { rawName: 'NEW SMART WATCH WITH TWO INTERCHANGEABLE STRAPS', priceStr: 'KES 4,400', pStart: 461, pEnd: 476 },
  { rawName: 'CRRJU LADIES WATCH', priceStr: 'KES 2,800', pStart: 476, pEnd: 481 },
  { rawName: 'FOXBOX DUAL TIME GENTS WATCH FB0058E', priceStr: 'KES 5,400', pStart: 481, pEnd: 488 },
  { rawName: 'Y13 Fitness smartwatch Waterproof', priceStr: 'Kes 2,800', pStart: 488, pEnd: 500 },
  { rawName: 'SKMEI 9357 Chronograph Gents watch', priceStr: 'KES 4,000', pStart: 500, pEnd: 506 },
  { rawName: 'CROSS PENDANTS MULTILAYED PEARL NECKLACES', priceStr: 'KES 1,200', pStart: 506, pEnd: 509 },
  { rawName: 'BOYFRIEND\'S DAY GIFT PACK', priceStr: 'KES 6,900', pStart: 509, pEnd: 515 },
  { rawName: 'NEW MEN GIFT PACK', priceStr: 'KES 5,000', pStart: 515, pEnd: 522 },
  { rawName: 'GENTS CURREN CHRONOGRAPH WATCH #8395', priceStr: 'KES 5,200', pStart: 522, pEnd: 528 },
  { rawName: 'ENGRAVABLE LADIES NECKLACE', priceStr: 'KES 600', pStart: 528, pEnd: 533 },
  { rawName: 'Double sided Patek Phillipe Gents watch', priceStr: 'KES 7,000', pStart: 533, pEnd: 539 },
  { rawName: 'EXECUTIVE AAA QUALITY WATCHES', priceStr: 'PRICE RANGE KES 20,000-24,000', pStart: 539, pEnd: 543 },
  { rawName: 'CASIO WORLDTIME', priceStr: 'KES 3,600', pStart: 543, pEnd: 547 },
  { rawName: 'NAVIFORCE GENTS WATCH #NF 8053', priceStr: 'KES 5,200', pStart: 547, pEnd: 553 },
  { rawName: 'WOODEN EXECUTIVE WATCH ORGANIZERS', priceStr: '6 slots KES 4,000 / 10 slots KES 5,400 / 12 slots KES 6,000', pStart: 553, pEnd: 557 },
  { rawName: 'CRRJU 5006 MEN WATCH', priceStr: 'KES 3,600', pStart: 557, pEnd: 563 },
  { rawName: 'FATHERS DAY GIFT', priceStr: 'KES 4,300', pStart: 563, pEnd: 570 },
  { rawName: 'RAMZ LATTAFA AVAILABLE 90ml', priceStr: 'Kes 2,000', pStart: 570, pEnd: 572 },
  { rawName: 'QAED AL FURSAN AVAILABLE 90ml', priceStr: 'Kes 2000', pStart: 572, pEnd: 574 },
  { rawName: '5 in 1 YARA X ASAD PACK BY LATTAFAH AVAILABLE 30ml each', priceStr: 'Kes 4,000', pStart: 574, pEnd: 576 },
  { rawName: 'SAKEENA & EMAAN BY LATTAFAH AVAILABLE 100ml', priceStr: 'Kes 3,200', pStart: 576, pEnd: 578 },
  { rawName: 'NOW BY LATTAFA COLLECTION 100ML', priceStr: 'KES 2,400', pStart: 578, pEnd: 580 },
  { rawName: 'OUD MOOD BY LATTAFA AVAILABLE 90ml', priceStr: 'Kes 2,400', pStart: 580, pEnd: 582 },
  { rawName: 'ATHERI LATTAFA 100ML', priceStr: 'KES 3,600', pStart: 582, pEnd: 584 },
  { rawName: 'SHAHEEN LATTAFA GOLD 100ML', priceStr: 'KES 2,800', pStart: 584, pEnd: 586 },
  { rawName: 'YARA SET (PERFUME SPRAY,FRESH HAIR MIST,YARA PERFUME)', priceStr: 'KES 4,000', pStart: 586, pEnd: 588 },
  { rawName: 'OPULENT OUD BY lattafa PERFUME', priceStr: 'KES 2,400', pStart: 588, pEnd: 590 },
  { rawName: 'MUSAMAM WHITE INTENSE BY lattafa PERFUME', priceStr: 'KES 4,000', pStart: 590, pEnd: 592 },
  { rawName: 'HIS CONFESSION BY lattafa PERFUME', priceStr: 'KES 3,600', pStart: 592, pEnd: 594 },
  { rawName: 'AMEERAT AL ARAB PERFUME', priceStr: 'KES 2,400', pStart: 594, pEnd: 596 },
  { rawName: 'Fakhar by Lattafa PERFUME', priceStr: 'KES 3,000', pStart: 596, pEnd: 598 },
  { rawName: 'ASAD PERFUMES BY LATTAFA 100ml', priceStr: 'KES 1,600', pStart: 598, pEnd: 600 },
  { rawName: 'KHAMRAH PERFUMES COLLECTION BY LATTAFA 30Ml Each', priceStr: 'KES 3,600', pStart: 600, pEnd: 602 },
  { rawName: 'LADIES GIFT SETS', priceStr: 'Kes 5,200', pStart: 602, pEnd: 606 },
  { rawName: 'CASIO EDIFICE GENTS WATCH', priceStr: 'KES 15,000', pStart: 606, pEnd: 612 },
  { rawName: 'WATCH STANDS', priceStr: 'KES 100 Each', pStart: 612, pEnd: 613 },
  { rawName: 'SKMEI LADY WATCH #2637', priceStr: 'KES 3,000', pStart: 613, pEnd: 617 },
  { rawName: 'TRENDY AP x SWATCH ROYAL POP', priceStr: 'KES 3,400', pStart: 617, pEnd: 621 },
  { rawName: 'SWATCH X AP AUTOMATIC', priceStr: 'KES 28,000', pStart: 621, pEnd: 625 },
  { rawName: 'TAG HEUER FORMULA 1', priceStr: 'Kes 3,400', pStart: 625, pEnd: 630 },
  { rawName: 'KHAMRAH 2 pc AVAILABLE', priceStr: 'Kes 3,000', pStart: 630, pEnd: 632 },
  { rawName: 'CASIO DIGITAL COUPLE PAIR', priceStr: 'KES 6,000', pStart: 632, pEnd: 636 },
  { rawName: 'CASIO DUAL TIME WATCH', priceStr: 'KES 3,200', pStart: 636, pEnd: 640 }
];

console.log('Parsing and matching products...');

// Let's create an exhaustive mapping function that handles any minor title variance
// e.g. "available", "each", parenthetical descriptions, #8142 vs generic name, etc.
function findMatchingImages(rawName) {
  let norm = normalize(stripColorSuffix(rawName));
  if (imageGroups.has(norm)) {
    return { normKey: norm, images: imageGroups.get(norm).map(x => x.file) };
  }

  // Handle specific text variances:
  // 1. "CURREN LADIES #9106 (METALLIC )" -> image is "CURREN LADIES #9106 (METALLIC )(gold).jpg"
  // When stripped of outer (gold), it is "CURREN LADIES #9106 (METALLIC )"
  // Normalizing "CURREN LADIES #9106 (METALLIC )" without stripping inner gives:
  let normWithParenContent = normalize(rawName.replace(/\s*\([^)]*\)\s*$/g, ''));
  if (imageGroups.has(normWithParenContent)) {
    return { normKey: normWithParenContent, images: imageGroups.get(normWithParenContent).map(x => x.file) };
  }

  // 2. Remove filler words: "available", "each", "in *100 languages*", etc.
  let cleaned = rawName
    .replace(/\bavailable\b/gi, '')
    .replace(/\beach\b/gi, '')
    .replace(/\bin\s*\*100 languages\*\b/gi, '')
    .replace(/#8142/g, '') // OPK GENTS CHRONOGRAPH WATCH #8142 -> OPK GENTS CHRONOGRAPH WATCH
    .replace(/\(leather\)/gi, '')
    .replace(/\(metallic\)/gi, '')
    .trim();
  
  let cleanedNorm = normalize(stripColorSuffix(cleaned));
  if (imageGroups.has(cleanedNorm)) {
    return { normKey: cleanedNorm, images: imageGroups.get(cleanedNorm).map(x => x.file) };
  }

  // 3. BOYFRIEND'S vs BOYFRIEND_S
  let underscoreNorm = normalize(stripColorSuffix(rawName.replace(/'/g, '_')));
  if (imageGroups.has(underscoreNorm)) {
    return { normKey: underscoreNorm, images: imageGroups.get(underscoreNorm).map(x => x.file) };
  }

  // 4. Try matching by base name in image files directly
  for (const [key, items] of imageGroups.entries()) {
    if (key === cleanedNorm || key.startsWith(cleanedNorm) || cleanedNorm.startsWith(key)) {
      return { normKey: key, images: items.map(x => x.file) };
    }
  }

  return { normKey: null, images: [] };
}

const matchedProducts = [];
const unmatchedProducts = [];
const matchedFilesSet = new Set();

rawProductEntries.forEach((entry, i) => {
  const matchResult = findMatchingImages(entry.rawName);
  
  // Extract bullet points
  const rawBullets = [];
  for (let pIdx = entry.pStart + 1; pIdx < entry.pEnd; pIdx++) {
    const text = paragraphs[pIdx].trim();
    if (text) {
      rawBullets.push(text);
    }
  }

  if (matchResult.images.length > 0) {
    matchedProducts.push({
      id: i + 1,
      rawName: entry.rawName,
      priceStr: entry.priceStr,
      bullets: rawBullets,
      normKey: matchResult.normKey,
      images: matchResult.images
    });
    matchResult.images.forEach(f => matchedFilesSet.add(f));
  } else {
    unmatchedProducts.push({
      id: i + 1,
      rawName: entry.rawName,
      priceStr: entry.priceStr,
      bullets: rawBullets
    });
  }
});

const unmatchedImages = imageFiles.filter(f => !matchedFilesSet.has(f));

console.log('================ MATCH SUMMARY ================');
console.log('Total Products in Details File:', rawProductEntries.length);
console.log('Matched Products:', matchedProducts.length);
console.log('Unmatched Products:', unmatchedProducts.length);
console.log('Total Images in public/PRODUCTS:', imageFiles.length);
console.log('Matched Image Files:', matchedFilesSet.size);
console.log('Unmatched Images:', unmatchedImages.length);

if (unmatchedProducts.length > 0) {
  console.log('\nUnmatched Products List:');
  unmatchedProducts.forEach(u => console.log(' - ' + u.rawName + ' (' + u.priceStr + ')'));
}

if (unmatchedImages.length > 0) {
  console.log('\nUnmatched Images List:');
  unmatchedImages.forEach(img => console.log(' - ' + img));
}

// Save detailed report to JSON
fs.writeFileSync('temp_docx/match_report.json', JSON.stringify({
  totalProductsInDetails: rawProductEntries.length,
  totalImagesInFolder: imageFiles.length,
  matchedProductsCount: matchedProducts.length,
  unmatchedProductsCount: unmatchedProducts.length,
  matchedImagesCount: matchedFilesSet.size,
  unmatchedImagesCount: unmatchedImages.length,
  matchedProducts,
  unmatchedProducts,
  unmatchedImages
}, null, 2));

console.log('Saved match report to temp_docx/match_report.json');
