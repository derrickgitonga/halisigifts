const fs = require('fs');
const path = require('path');

const parsedProducts = JSON.parse(fs.readFileSync('temp_docx/parsed_productss_test.json', 'utf8'));
const imageFiles = fs.readdirSync(path.join(process.cwd(), 'public', 'PRODUCTSs'));

function cleanNameForMatching(name) {
  return name
    .toLowerCase()
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\b\d+ml\b/gi, '')
    .replace(/\bkes\b|\bksh\b/gi, '')
    .replace(/[#*(),]/g, ' ')
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/['’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanImageForMatching(filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  return base
    .toLowerCase()
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\b\d+ml\b/gi, '')
    .replace(/[#*(),]/g, ' ')
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/['’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Exact/Dedicated mapping overrides for edge cases and multi-gift-sets
const dedicatedMap = {
  "valentines-men-gift-set": ["VALENTINES MEN GIFT SET.jpg"],
  "valentines-ladies-gift-set-2800": ["VALENTINES LADIES  GIFT SET.jpg", "VALENTINES LADIES GIFT SET.jpg"],
  "valentines-couple-gift-set-7000": [
    "VALENTINES COUPLE GIFT SET(black).jpg",
    "VALENTINES COUPLE GIFT SET(gold).jpg",
    "VALENTINES COUPLE GIFT SET(silver).jpg",
    "VALENTINES COUPLE GIFT SET(two-tone).jpg"
  ],
  "valentines-ladies-gift-8000": ["VALENTINES LADIES GIFT(gold).jpg", "VALENTINES LADIES GIFT(silver).jpg"],
  "valentines-ladies-gift-set-4300": ["VALENTINES LADIES GIFT SET1.jpg"],
  "valentines-ladies-gift-set-5000": ["VALENTINES LADIES GIFT SET 5000.jpg"],
  "valentines-ladies-gift-set-5600": ["VALENTINES LADIES GIFT SET 5600.jpg"],
  "valentines-ladies-gift-set-6800": ["VALENTINES LADIES GIFT SET 6800.jpg"],
  "valentines-couple-gift-set-3600": [
    "VALENTINES COUPLE GIFT SET 3600(black).jpg",
    "VALENTINES COUPLE GIFT SET 3600(gold).jpg",
    "VALENTINES COUPLE GIFT SET 3600(two-tone).jpg"
  ],
  "trendy-valentines-men-gift-set": ["TRENDY VALENTINES MEN GIFT SET.jpg"],
  "men-watch-valentines-gift": [
    "MEN WATCH VALENTINES GIFT (black).jpg",
    "MEN WATCH VALENTINES GIFT (gold).jpg"
  ],
  "3-strap-smartwatchmen-smart-watch": ["3 strap Smartwatch.jpg"],
  "2-strap-z12-pro-smartwatch": [
    "2 strap Z12 PRO Smartwatch(beige).jpg",
    "2 strap Z12 PRO Smartwatch(black).jpg"
  ],
  "z12-pro-smart-watch": [
    "Z12 PRO SMART WATCH.jpg",
    "Z12 PRO SMART WATCH(specs).jpg"
  ],
  "rolex-x-bracelet": [
    "ROLEX x BRACELET(black).jpg",
    "ROLEX x BRACELET(gold).jpg",
    "ROLEX x BRACELET(silver).jpg",
    "ROLEX x BRACELET(two-tone).jpg"
  ],
  "lady-rolex-x-bracelet": [
    "LADY ROLEX x BRACELET(black).jpg",
    "LADY ROLEX x BRACELET(blue).jpg",
    "LADY ROLEX x BRACELET(green).jpg"
  ],
  "6-in-1-mothers-day-gift-pack": ["6 in 1 MOTHERS DAY GIFT PACK.jpg"],
  "mothers-day-gift-pack-gift-set-x-chocolate-bar": ["MOTHERS DAY GIFT PACK GIFT SET X CHOCOLATE BAR.jpg"],
  "mothers-day-gift-pack-smart-band-x-jewelry-set": ["MOTHERS DAY GIFT PACK SMART BAND X JEWELRY SET.jpg"],
  "mothers-day-gift-pack-mousuf-gift-set-x-watch-x-purse": ["MOTHERS DAY GIFT PACK MOUSUF GIFT SET X WATCH x PURSE.jpg"],
  "mothers-day-gift-pack-gift-combo-x-jewellery-set": ["MOTHERS DAY GIFT PACK GIFT COMBO x JEWELLERY SET.jpg"],
  "club-de-nuit": ["Club de nuit.jpg"],
  "club-de-nuit-by-armaf-100ml": [
    "Club de nuit by ARMAF 100ML(man).jpg",
    "Club de nuit by ARMAF 100ML(woman).jpg",
    "Club de nuit by ARMAF 100ML.jpg"
  ],
  "afnan-9pm-and-ameerat-al-arab": [
    "Afnan 9pm.jpg",
    "Ameerat Al Arab.jpg"
  ],
  "gedi-lady-watch": [
    "GEDI LADY WATCH(animal print).jpg",
    "GEDI LADY WATCH(animal print)1.jpg"
  ],
  "gedi-lady-watchanimal-print": [
    "GEDI LADY WATCH(animal print).jpg",
    "GEDI LADY WATCH(animal print)1.jpg"
  ],
  "gedi-lady-watchelegant-design": [
    "GEDI LADY WATCH(Elegant design).jpg"
  ],
  "gedi-square-lady-watch": [
    "GEDI Square lady Watch()gold).jpg",
    "GEDI Square lady Watch(silver).jpg"
  ],
  "gedi-ladies-watch-leather-straps": [
    "GEDI LADIES WATCH (Leather straps)(gold brown).jpg",
    "GEDI LADIES WATCH (Leather straps)(silver black).jpg"
  ],
  "arabic-aura-watch": [
    "ARABIC AURA WATCH(black).jpg",
    "ARABIC AURA WATCH(silver).jpg"
  ],
  "sabr-magnetic-arabic-aura-watch": [
    "SABR MAGNETIC ARABIC AURA WATCH(black).jpg",
    "SABR MAGNETIC ARABIC AURA WATCH(white).jpg"
  ],
  "mousuf-perfume-wardiaswadsexyoriginal": [
    "MOUSUF PERFUM.jpg",
    "MOUSUF PERFUM1.jpg"
  ],
  "gissah-perfumes-200ml": [
    "GISSAH PERFUMES(black).jpg",
    "GISSAH PERFUMES(gold).jpg",
    "GISSAH PERFUMES(red).jpg"
  ],
  "megir-chronograph-gentsanalogue-watch": [
    "MEGIR CHRONOGRAPH GENTS WATCH(black).jpg",
    "MEGIR CHRONOGRAPH GENTS WATCH(brown).jpg",
    "MEGIR CHRONOGRAPH GENTS WATCH.jpg"
  ],
  "wooden-executive-boxes": [
    "WOODEN EXECUTIVE BOXES.jpg"
  ],
  "curren-gents-8403": []
};

const imageUsage = new Map();
imageFiles.forEach(f => imageUsage.set(f, []));

parsedProducts.forEach(product => {
  // If dedicated map exists
  if (dedicatedMap[product.slug] !== undefined) {
    product.matchedImages = dedicatedMap[product.slug];
    product.matchedImages.forEach(img => {
      if (imageUsage.has(img)) imageUsage.get(img).push(product.slug);
    });
    return;
  }

  const pClean = cleanNameForMatching(product.name);
  const matches = [];

  imageFiles.forEach(imgFile => {
    // Skip if already in dedicated maps
    const imgClean = cleanImageForMatching(imgFile);

    if (imgClean === pClean || imgClean.startsWith(pClean) || pClean.startsWith(imgClean)) {
      matches.push(imgFile);
      imageUsage.get(imgFile).push(product.slug);
      return;
    }

    // Check key model or distinctive tokens
    const pModel = pClean.match(/\b\d{4}\b|\bnf\d+\b/);
    const imgModel = imgClean.match(/\b\d{4}\b|\bnf\d+\b/);
    if (pModel && imgModel) {
      if (pModel[0] === imgModel[0]) {
        matches.push(imgFile);
        imageUsage.get(imgFile).push(product.slug);
      }
    }
  });

  product.matchedImages = Array.from(new Set(matches));
});

console.log('=== VERIFICATION OF ALL 76 PRODUCTS ===');
let matchedCount = 0;
let unmatchedCount = 0;

parsedProducts.forEach((p, idx) => {
  if (p.matchedImages.length > 0) {
    matchedCount++;
    console.log(`[${idx+1}] [OK] ${p.name} -> ${p.matchedImages.length} images: [${p.matchedImages.join(', ')}]`);
  } else {
    unmatchedCount++;
    console.log(`[${idx+1}] [NO IMAGE] ${p.name} (KES ${p.price}) -> 0 images`);
  }
});

console.log(`\nMatched Products: ${matchedCount} / ${parsedProducts.length}`);
console.log(`Unmatched Products: ${unmatchedCount}`);

const unusedImages = [];
for (const [img, slugs] of imageUsage.entries()) {
  if (slugs.length === 0) unusedImages.push(img);
}

console.log(`\nUnused Images (${unusedImages.length}):`, unusedImages);

fs.writeFileSync('temp_docx/final_matched_products.json', JSON.stringify(parsedProducts, null, 2));
