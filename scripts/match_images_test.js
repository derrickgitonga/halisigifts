const fs = require('fs');
const path = require('path');

const parsedProducts = JSON.parse(fs.readFileSync('temp_docx/parsed_productss_test.json', 'utf8'));
const imageFiles = fs.readdirSync(path.join(process.cwd(), 'public', 'PRODUCTSs'));

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\.jpe?g|\.png|\.webp/gi, '')
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/['’]/g, '')
    .replace(/[#*()_,]/g, ' ')
    .replace(/kes\s*[\d,]+/g, '')
    .replace(/ksh\s*[\d,]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Track image usage
const imageUsage = new Map();
imageFiles.forEach(f => imageUsage.set(f, []));

// Special manual / exact pattern rules for cases where name is slightly different in image file
const specialMap = {
  "fossil skeleton automatic watch": ["fossil skeleton automatic"],
  "g shock casio": ["g shock casio"],
  "wooden executive boxes": ["wooden executive boxes"],
  "elegant gift cards": ["elegant gift cards"],
  "mousuf perfume (wardi,aswad,sexy,original)": ["mousuf perfum"],
  "mousuf perfume": ["mousuf perfum"],
  "afnan 9pm and ameerat al arab": ["afnan 9pm", "ameerat al arab"],
  "club de nuit": ["club de nuit.jpg"],
  "club de nuit by armaf 100ml": ["club de nuit by armaf 100ml"],
  "valentines ladies gift set": {
    5000: ["valentines ladies gift set 5000"],
    5600: ["valentines ladies gift set 5600"],
    6800: ["valentines ladies gift set 6800"],
    2800: ["valentines ladies gift set.jpg", "valentines ladies  gift set.jpg"],
    4300: ["valentines ladies gift set1.jpg"]
  },
  "valentines couple gift set": {
    3600: ["valentines couple gift set 3600"],
    7000: ["valentines couple gift set(black).jpg", "valentines couple gift set(gold).jpg", "valentines couple gift set(silver).jpg", "valentines couple gift set(two-tone).jpg"]
  },
  "valentines ladies gift": {
    8000: ["valentines ladies gift(gold).jpg", "valentines ladies gift(silver).jpg"]
  }
};

parsedProducts.forEach(product => {
  const pNorm = normalize(product.name);
  const pPrice = product.price;

  const matches = [];

  imageFiles.forEach(imgFile => {
    const imgNorm = normalize(imgFile);

    // Check special maps
    if (product.name.toUpperCase().startsWith("VALENTINES LADIES GIFT SET") && specialMap["valentines ladies gift set"][pPrice]) {
      const targets = specialMap["valentines ladies gift set"][pPrice];
      if (targets.some(t => imgFile.toLowerCase().includes(t.toLowerCase()))) {
        matches.push(imgFile);
        imageUsage.get(imgFile).push(product.slug);
        return;
      }
    } else if (product.name.toUpperCase().startsWith("VALENTINES COUPLE GIFT SET") && specialMap["valentines couple gift set"][pPrice]) {
      const targets = specialMap["valentines couple gift set"][pPrice];
      if (targets.some(t => imgFile.toLowerCase().includes(t.toLowerCase()))) {
        matches.push(imgFile);
        imageUsage.get(imgFile).push(product.slug);
        return;
      }
    } else if (product.name.toUpperCase() === "VALENTINES LADIES GIFT" && specialMap["valentines ladies gift"][pPrice]) {
      const targets = specialMap["valentines ladies gift"][pPrice];
      if (targets.some(t => imgFile.toLowerCase().includes(t.toLowerCase()))) {
        matches.push(imgFile);
        imageUsage.get(imgFile).push(product.slug);
        return;
      }
    } else if (pNorm === "afnan 9pm and ameerat al arab") {
      if (imgFile.toLowerCase().startsWith("afnan 9pm") || imgFile.toLowerCase().startsWith("ameerat al arab")) {
        matches.push(imgFile);
        imageUsage.get(imgFile).push(product.slug);
        return;
      }
    } else if (pNorm === "club de nuit") {
      if (imgFile.toLowerCase() === "club de nuit.jpg") {
        matches.push(imgFile);
        imageUsage.get(imgFile).push(product.slug);
        return;
      }
    } else if (pNorm === "club de nuit by armaf 100ml") {
      if (imgFile.toLowerCase().startsWith("club de nuit by armaf 100ml")) {
        matches.push(imgFile);
        imageUsage.get(imgFile).push(product.slug);
        return;
      }
    } else if (pNorm.includes("curren gents 8403")) {
      // 8403 has no image
      return;
    }

    // Normal matching logic
    // Exclude Valentine set collisions if not in special map
    if (imgFile.toLowerCase().includes("valentines ladies gift set") || imgFile.toLowerCase().includes("valentines couple gift set") || imgFile.toLowerCase().includes("valentines ladies gift")) {
      return;
    }

    // 1. Exact or prefix match
    if (imgNorm === pNorm || imgNorm.startsWith(pNorm) || pNorm.startsWith(imgNorm)) {
      matches.push(imgFile);
      imageUsage.get(imgFile).push(product.slug);
      return;
    }

    // 2. Token overlap match (e.g. "fossil skeleton automatic watch" vs "fossil skeleton automatic(blue).jpg")
    const pTokens = pNorm.split(' ').filter(t => t.length > 2 && t !== 'watch' && t !== 'watches' && t !== 'gents' && t !== 'ladies' && t !== 'men');
    const imgTokens = imgNorm.split(' ').filter(t => t.length > 2 && t !== 'watch' && t !== 'watches' && t !== 'gents' && t !== 'ladies' && t !== 'men');

    if (pTokens.length > 0) {
      const matchAllTokens = pTokens.every(t => imgTokens.includes(t) || imgNorm.includes(t));
      if (matchAllTokens) {
        // Ensure model numbers or key distinguishing tokens match
        const pModel = pNorm.match(/\b\d{4}\b|\bnf\d+\b/);
        const imgModel = imgNorm.match(/\b\d{4}\b|\bnf\d+\b/);
        if (pModel && imgModel && pModel[0] !== imgModel[0]) {
          return; // different model
        }

        matches.push(imgFile);
        imageUsage.get(imgFile).push(product.slug);
      }
    }
  });

  product.matchedImages = Array.from(new Set(matches));
});

console.log('=== MATCH RESULTS ===');
let matchedCount = 0;
let unmatchedCount = 0;

parsedProducts.forEach((p, idx) => {
  if (p.matchedImages.length > 0) {
    matchedCount++;
    console.log(`[OK] ${p.name} (KES ${p.price}) -> ${p.matchedImages.length} images: [${p.matchedImages.join(', ')}]`);
  } else {
    unmatchedCount++;
    console.log(`[NO IMAGE] ${p.name} (KES ${p.price}) -> 0 images`);
  }
});

console.log(`\nMatched Products: ${matchedCount} / ${parsedProducts.length}`);
console.log(`Unmatched Products: ${unmatchedCount}`);

const unusedImages = [];
const multiUsedImages = [];
for (const [img, slugs] of imageUsage.entries()) {
  if (slugs.length === 0) unusedImages.push(img);
  else if (slugs.length > 1) multiUsedImages.push({ img, slugs });
}

console.log(`\nUnused Images (${unusedImages.length}):`, unusedImages);
if (multiUsedImages.length > 0) {
  console.log(`\nMulti-used Images (${multiUsedImages.length}):`, multiUsedImages);
}

fs.writeFileSync('temp_docx/matched_products_test.json', JSON.stringify(parsedProducts, null, 2));
