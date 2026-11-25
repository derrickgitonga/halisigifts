const fs = require('fs');
const path = require('path');

const lines = JSON.parse(fs.readFileSync('temp_docx/extracted_productss_paragraphs.json', 'utf8'));
const imageFiles = fs.readdirSync(path.join(process.cwd(), 'public', 'PRODUCTSs'));

console.log(`Loaded ${lines.length} lines from docx and ${imageFiles.length} images from public/PRODUCTSs`);

function cleanHtml(str) {
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/[#*(),]/g, ' ')
    .replace(/kes\s*[\d,]+/g, '')
    .replace(/ksh\s*[\d,]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build products from raw lines
const rawProducts = [];
let current = null;

function isProductHeader(line) {
  if (/(?:kes|ksh)\s*[\d,]+/i.test(line)) {
    if (/brand labels/i.test(line) && /sticker/i.test(line)) return false;
    return true;
  }
  return false;
}

for (let i = 0; i < lines.length; i++) {
  const line = cleanHtml(lines[i]);
  if (!line) continue;

  if (isProductHeader(line)) {
    if (current) rawProducts.push(current);
    current = { header: line, lines: [] };
  } else {
    if (line.includes('PERFUME SETS 30Ml per bottle')) {
      // It's a sub-header note before Club de nuit 30ml
      continue;
    }
    if (current) {
      current.lines.push(line);
    }
  }
}
if (current) rawProducts.push(current);

console.log(`Parsed ${rawProducts.length} raw product blocks.`);

// Categorization helper based on user prompt taxonomy
function getCategory(name, descBullets) {
  const n = name.toLowerCase();
  const d = descBullets.join(' ').toLowerCase();

  // 1. Valentine's Gift Sets
  if (n.startsWith('valentines') || n.includes('valentines gift') || n.includes('valentines men gift') || n.includes('valentines ladies gift') || n.includes('valentines couple gift')) {
    return {
      name: "Valentine's Gift Sets",
      slug: "valentines-gift-sets"
    };
  }

  // 2. Mother's Day Gift Sets
  if (n.startsWith('mothers day') || n.includes('mothers day gift') || n.includes('6 in 1 mothers day')) {
    return {
      name: "Mother's Day Gift Sets",
      slug: "mothers-day-gift-sets"
    };
  }

  // 3. Smart Watches
  if (n.includes('smartwatch') || n.includes('smart watch') || n.includes('smart band') || d.includes('smartwatch') || d.includes('smart watch') || d.includes('pedometer') || d.includes('heart rate')) {
    return {
      name: "Smart Watches",
      slug: "smart-watches"
    };
  }

  // 4. Perfumes & Fragrances
  if (n.includes('perfume') || n.includes('fragrance') || n.includes('100ml') || n.includes('75ml') || n.includes('70ml') || n.includes('200ml') || n.includes('90ml') || n.includes('30ml') || n.includes('oud') || d.includes('unforgettable fragrance') || d.includes('signature fragrance') || d.includes('bold and unforgettable') || n.includes('club de nuit') || n.includes('afnan') || n.includes('ameerat') || n.includes('mousuf') || n.includes('azzaro') || n.includes('hawas') || n.includes('nebras') || n.includes('odyssey') || n.includes('orientica') || n.includes('jameela') || n.includes('liquid brun')) {
    return {
      name: "Perfumes & Fragrances",
      slug: "perfumes-fragrances"
    };
  }

  // 5. Jewellery
  if (n.includes('necklace') || n.includes('jewellery set') || n.includes('jewelry set') || n.includes('earrings') || n.includes('bracelet') && !n.includes('watch') && !n.includes('rolex')) {
    return {
      name: "Jewellery",
      slug: "jewellery"
    };
  }

  // 6. Accessories & Gift Boxes
  if (n.includes('wooden executive') || n.includes('gift box') || n.includes('gift card') || n.includes('box') && !n.includes('set')) {
    return {
      name: "Accessories & Gift Boxes",
      slug: "accessories-gift-boxes"
    };
  }

  // 7. Watches - Couple Sets
  if (n.includes('couple') || n.includes('per piece') && n.includes('pair') || n.includes('gents and ladies watches') || d.includes('men+ladies') || d.includes('men+women') || d.includes('couple watch') || d.includes('unisex(analogue)')) {
    return {
      name: "Watches – Couple Sets",
      slug: "watches-couple-sets"
    };
  }

  // 8. Watches - Ladies
  if (n.includes('ladies') || n.includes('lady') || d.includes('ladies analogue') || d.includes('ladies watch') || d.includes('perfect gift to her')) {
    return {
      name: "Watches – Ladies",
      slug: "watches-ladies"
    };
  }

  // 9. Watches - Men
  if (n.includes('men') || n.includes('gents') || n.includes('chronograph') || n.includes('watch') || d.includes('men analogue') || d.includes('gents watch') || d.includes('automatic')) {
    return {
      name: "Watches – Men",
      slug: "watches-men"
    };
  }

  return {
    name: "Watches – Men",
    slug: "watches-men"
  };
}

// Process each product
const parsedProducts = [];

rawProducts.forEach((rp, idx) => {
  const header = rp.header;
  let name = header;
  let price = 0;
  let priceMin = null;
  let priceMax = null;
  let variants = [];
  let colourOptions = [];

  // Parse prices and edge cases
  // Edge Case 1: "CASIO SQUARE KES 2,400 per piece Kes 4,800 a pair"
  if (/per piece.*a pair/i.test(header) || /per piece/i.test(header)) {
    const prices = header.match(/(?:kes|ksh)\s*([\d,]+)/gi) || [];
    const p1 = prices[0] ? parseInt(prices[0].replace(/[^\d]/g, ''), 10) : 0;
    const p2 = prices[1] ? parseInt(prices[1].replace(/[^\d]/g, ''), 10) : p1 * 2;
    price = p1;
    priceMin = p1;
    priceMax = p2;
    name = header.replace(/(?:kes|ksh)\s*[\d,]+.*$/i, '').trim();
    variants = [
      { name: "Single Piece", price: p1 },
      { name: "Couple Pair (2 Watches)", price: p2 }
    ];
  }
  // Edge Case 2: "DAY&DATE GENTS AND LADIES WATCHES KES 1,800 , Couple Set KES 3,600"
  else if (/couple set/i.test(header) && (header.match(/(?:kes|ksh)\s*[\d,]+/gi) || []).length > 1) {
    const prices = header.match(/(?:kes|ksh)\s*([\d,]+)/gi) || [];
    const p1 = prices[0] ? parseInt(prices[0].replace(/[^\d]/g, ''), 10) : 0;
    const p2 = prices[1] ? parseInt(prices[1].replace(/[^\d]/g, ''), 10) : p1 * 2;
    price = p1;
    priceMin = p1;
    priceMax = p2;
    name = header.replace(/(?:kes|ksh)\s*[\d,]+.*$/i, '').trim();
    variants = [
      { name: "Single Watch", price: p1 },
      { name: "Couple Set (Pair)", price: p2 }
    ];
  }
  // Edge Case 3: "WOODEN EXECUTIVE BOXES AVAILABLE KES 800 (plain box)" with sticker note
  else if (/wooden executive boxes/i.test(header)) {
    price = 800;
    name = "WOODEN EXECUTIVE BOXES";
    variants = [
      { name: "Plain Wooden Box", price: 800 },
      { name: "With Watch Brand Label Sticker", price: 900 }
    ];
  }
  // Standard single price
  else {
    const match = header.match(/(?:kes|ksh)\s*([\d,]+)/i);
    if (match) {
      price = parseInt(match[1].replace(/,/g, ''), 10);
      name = header.replace(/(?:kes|ksh)\s*[\d,]+/i, '').trim();
    }
  }

  // Clean up name
  name = name.replace(/\s+/g, ' ').trim();
  // Remove trailing dashes or colons
  name = name.replace(/[-:]+$/, '').trim();

  // Extract colour options from description lines or name
  const descBullets = [];
  rp.lines.forEach(l => {
    // Check if line lists colours like "Gold white, Silver, Gold Green, Silver Blue"
    if (/gold white/i.test(l) || (/colours|colors/i.test(l) && /ladies|men/i.test(l))) {
      const colMatch = l.match(/^(.*?)\s*\(/);
      if (colMatch) {
        const parts = colMatch[1].split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length > 1) {
          colourOptions.push(...parts);
        }
      }
    } else if (l.startsWith('Black Brown')) {
      colourOptions.push('Black', 'Brown');
    } else {
      descBullets.push(l);
    }
  });

  const category = getCategory(name, descBullets);

  // Generate unique slug
  let slugBase = name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['’]/g, '')
    .replace(/[#*()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Add price differentiator for duplicate names like "VALENTINES LADIES GIFT SET"
  if (name.toUpperCase().startsWith('VALENTINES LADIES GIFT SET') || name.toUpperCase().startsWith('VALENTINES COUPLE GIFT SET')) {
    slugBase = `${slugBase}-${price}`;
  }

  parsedProducts.push({
    rawHeader: header,
    name,
    slug: slugBase,
    price,
    priceMin,
    priceMax,
    category,
    descBullets,
    variants,
    colourOptions,
    matchedImages: []
  });
});

console.log(`Successfully mapped ${parsedProducts.length} structured product items.`);

// Check for slug duplicates
const slugMap = new Map();
parsedProducts.forEach(p => {
  if (slugMap.has(p.slug)) {
    console.warn(`Duplicate slug detected: ${p.slug} (${p.name})`);
  }
  slugMap.set(p.slug, true);
});

fs.writeFileSync('temp_docx/parsed_productss_test.json', JSON.stringify(parsedProducts, null, 2));
