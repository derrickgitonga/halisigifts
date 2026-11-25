const fs = require('fs');
const path = require('path');

function slugifyImageName(filename) {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext);

  const slug = base
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/['’]/g, '')
    .replace(/[_]/g, '-')
    .replace(/[#*]/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/[\(\)]/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${slug}${ext}`;
}

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

// All images available in public/product and public/PRODUCTSs
const productImages = fs.readdirSync('public/product');

// Dedicated image mapping for each product in this batch
const dedicatedBatchMap = {
  'michael-kors-mk-chronograph': [
    'MICHAEL KORS (MK) CHRONOGRAPH(black).jfif',
    'MICHAEL KORS (MK) CHRONOGRAPH(blue).jfif',
    'MICHAEL KORS (MK) CHRONOGRAPH(gold).jfif',
    'MICHAEL KORS (MK) CHRONOGRAPH(green).jfif'
  ],
  'lige-lg8963a': [
    'LIGE LG8963A.jfif',
    'LIGE LG8963A(1).jfif'
  ],
  'daniel-wellington': [
    'DANIEL WELLINGTON(gold screen).jfif',
    'DANIEL WELLINGTON(gold).jfif',
    'DANIEL WELLINGTON(gold- silver).jfif',
    'DANIEL WELLINGTON(silver- black).jfif'
  ],
  'opk-couple-watch': [
    'OPK COUPLE WATCH(gold).jfif',
    'OPK COUPLE WATCH(silver - black).jfif',
    'OPK COUPLE WATCH(silver).jfif'
  ],
  'poedagar-gents': [
    'Poedagar Gents(black).jfif'
  ],
  'casio-digital': [
    'CASIO DIGITAL( gold - black).jfif',
    'CASIO DIGITAL(black - shiny).jfif',
    'CASIO DIGITAL(black).jfif',
    'CASIO DIGITAL(gold -  pink).jfif',
    'CASIO DIGITAL(gold).jfif',
    'CASIO DIGITAL(shiny  - black).jfif'
  ],
  'ochstin-chronograph-gents-watch': [
    'OCHSTIN  CHRONOGRAPH GENTS WATCH(black -  blue).jfif',
    'OCHSTIN  CHRONOGRAPH GENTS WATCH(black - gold).jfif',
    'OCHSTIN  CHRONOGRAPH GENTS WATCH(black).jfif',
    'OCHSTIN  CHRONOGRAPH GENTS WATCH(brown).jfif'
  ],
  'curren-gents-8301': [
    'CURREN GENTS 8301.jfif'
  ],
  'school-digital-casio': [
    'SCHOOL DIGITAL CASIO.jfif',
    'SCHOOL DIGITAL CASIO(blue).jfif'
  ],
  'oruss-ladies-day-and-date': [
    'ORUSS LADIES DAY & DATE(gold  -purple).jfif',
    'ORUSS LADIES DAY & DATE(gold).jfif',
    'ORUSS LADIES DAY & DATE(pink).jfif'
  ],
  'casio-unisex': [
    'CASIO UNISEX(gold - green).jfif',
    'CASIO UNISEX(gold- pink).jfif',
    'CASIO UNISEX(silver - gold).jfif'
  ],
  'olevs-ladies-watch': [
    'OLEVS LADIES WATCH(gold - pink).jfif',
    'OLEVS LADIES WATCH(gold - red).jfif',
    'OLEVS LADIES WATCH(gold - white).jfif',
    'OLEVS LADIES WATCH(gold -green).jfif',
    'OLEVS LADIES WATCH(gold- brown).jfif'
  ],
  'naviforce-gents-watch-nf-9117': [
    'NAVIFORCE GENTS WATCH #NF 9117(black).jfif',
    'NAVIFORCE GENTS WATCH #NF 9117(gold).jfif',
    'NAVIFORCE GENTS WATCH #NF 9117(silver).jfif'
  ],
  'pro-9-gs-smart-watch': [
    'PRO 9 GS SMART WATCH.jfif'
  ],
  'daniel-wellington-ladies-watch-x-bracelet': [
    'DANIEL WELLINGTON LADIES WATCH X BRACELET(black).jfif',
    'DANIEL WELLINGTON LADIES WATCH X BRACELET(gold - green).jfif',
    'DANIEL WELLINGTON LADIES WATCH X BRACELET(gold -black).jfif',
    'DANIEL WELLINGTON LADIES WATCH X BRACELET(gold -blue).jfif',
    'DANIEL WELLINGTON LADIES WATCH X BRACELET(gold).jfif',
    'DANIEL WELLINGTON LADIES WATCH X BRACELET(green).jfif',
    'DANIEL WELLINGTON LADIES WATCH X BRACELET(silver - white).jfif',
    'DANIEL WELLINGTON LADIES WATCH X BRACELET(silver -black).jfif',
    'DANIEL WELLINGTON LADIES WATCH X BRACELET(silver).jfif',
    'DANIEL WELLINGTON LADIES WATCH X BRACELET(silver- blue).jfif'
  ],
  'twin-box-available': [],
  '3-in-1-detachable-ladies-necklace': [
    '3 IN 1 DETACHABLE LADIES NECKLACE.jfif'
  ],
  'curren-gents-watch-8365': [
    'CURREN  GENTS WATCH #8365(black).jfif',
    'CURREN  GENTS WATCH #8365(blue).jfif'
  ],
  'curren-branded-box': [],
  '3-in-1-olevs-gift-set': [
    '3 IN 1 OLEVS GIFT SET (blue).jfif',
    '3 IN 1 OLEVS GIFT SET (gold).jfif',
    '3 IN 1 OLEVS GIFT SET (orange).jfif',
    '3 IN 1 OLEVS GIFT SET (purple).jfif',
    '3 IN 1 OLEVS GIFT SET (white).jfif'
  ],
  'naviforce-nf8051': [
    'NAVIFORCE  NF8051(black).jfif',
    'NAVIFORCE  NF8051(blue).jfif',
    'NAVIFORCE  NF8051(green).jfif',
    'NAVIFORCE  NF8051(white).jfif'
  ],
  'opk-gents-watch-8152': [
    'OPK GENTS WATCH #8152(black).jfif',
    'OPK GENTS WATCH #8152(silver).jfif',
    'OPK GENTS WATCH #8152(silver- black).jfif'
  ],
  'poedagar-gents-watch': [
    'POEDAGAR GENTS WATCH(black).jfif',
    'POEDAGAR GENTS WATCH(blue).jfif',
    'POEDAGAR GENTS WATCH(green).jfif',
    'POEDAGAR GENTS WATCH(white).jfif'
  ],
  'd18-smart-watch-gs': [
    'D18  SMART WATCH GS.jfif'
  ],
  '4pc-matching-jewellery-sets-1600': [
    '4pc Matching Jewellery Sets(diamond).jfif',
    '4pc Matching Jewellery Sets(gold).jfif',
    '4pc Matching Jewellery Sets(green).jfif',
    '4pc Matching Jewellery Sets(red).jfif',
    '4pc Matching Jewellery Sets(silve beads).jfif',
    '4pc Matching Jewellery Sets(silver).jfif'
  ],
  '4-pc-matching-jewellery-sets-1400': [
    '4 PC MATCHING JEWELLERY SETS(green).jfif',
    '4 PC MATCHING JEWELLERY SETS(red).jfif',
    '4 PC MATCHING JEWELLERY SETS(white).jfif'
  ],
  'skmei-men-digital-2353': [
    'SKMEI Men Digital 2353(gold).jfif',
    'SKMEI Men Digital 2353(gold1).jfif',
    'SKMEI Men Digital 2353(silver).jfif',
    'SKMEI Men Digital 2353(silver1).jfif'
  ],
  'oruss-men-date-watch': [
    'ORUSS MEN DATE WATCH(black).jfif',
    'ORUSS MEN DATE WATCH(gold).jfif',
    'ORUSS MEN DATE WATCH(white).jfif'
  ],
  'curren-ladies-9051': [
    'CURREN LADIES #9051(blue).jfif',
    'CURREN LADIES #9051(pink).jfif',
    'CURREN LADIES #9051(white).jfif'
  ],
  'opk-gents-watch-8172': [
    'OPK GENTS WATCH #8172(silver).jfif',
    'OPK GENTS WATCH #8172.jfif'
  ],
  'elegant-matching-jewellery-sets': [
    'ELEGANT MATCHING JEWELLERY SETS(black).jfif',
    'ELEGANT MATCHING JEWELLERY SETS(blue).jfif',
    'ELEGANT MATCHING JEWELLERY SETS(green).jfif',
    'ELEGANT MATCHING JEWELLERY SETS(white)).jfif'
  ]
};

console.log('=== VERIFYING DEDICATED MAPPINGS ===');
let mappedImagesTotal = 0;
for (const [slug, imgs] of Object.entries(dedicatedBatchMap)) {
  console.log(`\nProduct slug: ${slug} (${imgs.length} images)`);
  imgs.forEach(img => {
    const exists = productImages.includes(img);
    console.log(`  - ${img} => ${slugifyImageName(img)} [found: ${exists}]`);
    if (!exists) console.error(`    ERROR: ${img} NOT FOUND in public/product`);
  });
  mappedImagesTotal += imgs.length;
}
console.log(`\nTotal mapped images: ${mappedImagesTotal} of 97 files in public/product`);
