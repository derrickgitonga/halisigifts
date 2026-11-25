const fs = require('fs');
const path = require('path');

const lines = JSON.parse(fs.readFileSync('temp_docx/extracted_productss_paragraphs.json', 'utf8'));
const imageFiles = fs.readdirSync(path.join(process.cwd(), 'public', 'PRODUCTSs'));

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

function slugifyFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext);

  let slug = base
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

// 1. Build all product blocks from docx
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
      continue;
    }
    if (current) {
      current.lines.push(line);
    }
  }
}
if (current) rawProducts.push(current);

// 2. Exact 9 categories taxonomy with precise slugs
const taxonomyCategories = [
  {
    name: "Valentine's Gift Sets",
    slug: "valentines-gift-sets",
    description: "Romantic luxury gift hampers, timepiece pairings, chocolates, and preserved roses."
  },
  {
    name: "Mother's Day Gift Sets",
    slug: "mothers-day-gift-sets",
    description: "Curated gift packs featuring jewellery, Arabian perfumes, watches, and pampering essentials."
  },
  {
    name: "Watches – Men",
    slug: "watches-men",
    description: "Precision analogue, chronograph, skeleton automatic and quartz timepieces for gentlemen."
  },
  {
    name: "Watches – Ladies",
    slug: "watches-ladies",
    description: "Elegant, sophisticated, iced and minimalist timepieces tailored for ladies."
  },
  {
    name: "Watches – Couple Sets",
    slug: "watches-couple-sets",
    description: "Matching pairs and sets for couples celebrating love and shared moments."
  },
  {
    name: "Smart Watches",
    slug: "smart-watches",
    description: "Next-generation smartwatches with health tracking, Bluetooth calling, and multi-sport features."
  },
  {
    name: "Perfumes & Fragrances",
    slug: "perfumes-fragrances",
    description: "Authentic luxury Arabian fragrances, oud moods, and signature perfume sets."
  },
  {
    name: "Jewellery",
    slug: "jewellery",
    description: "Exquisite necklaces, bracelets, pearl sets, and tarnish-free engravable pieces."
  },
  {
    name: "Accessories & Gift Boxes",
    slug: "accessories-gift-boxes",
    description: "Wooden executive watch presentation boxes, brand labels, and elegant gift cards."
  }
];

function getCategory(name, descBullets) {
  const n = name.toLowerCase();
  const d = descBullets.join(' ').toLowerCase();

  // 1. Valentine's Gift Sets
  if (n.startsWith('valentines') || n.includes('valentines gift') || n.includes('valentines men gift') || n.includes('valentines ladies gift') || n.includes('valentines couple gift')) {
    return { name: "Valentine's Gift Sets", slug: "valentines-gift-sets" };
  }

  // 2. Mother's Day Gift Sets
  if (n.startsWith('mothers day') || n.includes('mothers day gift') || n.includes('6 in 1 mothers day')) {
    return { name: "Mother's Day Gift Sets", slug: "mothers-day-gift-sets" };
  }

  // 3. Smart Watches
  if (n.includes('smartwatch') || n.includes('smart watch') || n.includes('smart band') || d.includes('smartwatch') || d.includes('smart watch') || d.includes('pedometer') || d.includes('heart rate')) {
    return { name: "Smart Watches", slug: "smart-watches" };
  }

  // 4. Perfumes & Fragrances
  if (n.includes('perfume') || n.includes('fragrance') || n.includes('100ml') || n.includes('75ml') || n.includes('70ml') || n.includes('200ml') || n.includes('90ml') || n.includes('30ml') || n.includes('oud') || d.includes('unforgettable fragrance') || d.includes('signature fragrance') || d.includes('bold and unforgettable') || n.includes('club de nuit') || n.includes('afnan') || n.includes('ameerat') || n.includes('mousuf') || n.includes('azzaro') || n.includes('hawas') || n.includes('nebras') || n.includes('odyssey') || n.includes('orientica') || n.includes('jameela') || n.includes('liquid brun')) {
    return { name: "Perfumes & Fragrances", slug: "perfumes-fragrances" };
  }

  // 5. Jewellery
  if (n.includes('necklace') || n.includes('jewellery set') || n.includes('jewelry set') || n.includes('earrings') || (n.includes('bracelet') && !n.includes('watch') && !n.includes('rolex'))) {
    return { name: "Jewellery", slug: "jewellery" };
  }

  // 6. Accessories & Gift Boxes
  if (n.includes('wooden executive') || n.includes('gift box') || n.includes('gift card') || (n.includes('box') && !n.includes('set') && !n.includes('pack'))) {
    return { name: "Accessories & Gift Boxes", slug: "accessories-gift-boxes" };
  }

  // 7. Watches - Couple Sets
  if (n.includes('couple') || (n.includes('per piece') && n.includes('pair')) || n.includes('gents and ladies watches') || d.includes('men+ladies') || d.includes('men+women') || d.includes('couple watch') || d.includes('unisex(analogue)')) {
    return { name: "Watches – Couple Sets", slug: "watches-couple-sets" };
  }

  // 8. Watches - Ladies
  if (n.includes('ladies') || n.includes('lady') || d.includes('ladies analogue') || d.includes('ladies watch') || d.includes('perfect gift to her')) {
    return { name: "Watches – Ladies", slug: "watches-ladies" };
  }

  // 9. Watches - Men
  return { name: "Watches – Men", slug: "watches-men" };
}

// 3. Process products with updated colour variant list parsing & single base product for Wooden Executive Boxes
const parsedCatalog = [];

rawProducts.forEach((rp, idx) => {
  const header = rp.header;
  let name = header;
  let price = 0;
  let priceMin = null;
  let priceMax = null;
  let variants = [];
  let extractedColours = [];
  let impliedColoursNote = null;

  // Rule 1: WOODEN EXECUTIVE BOXES is a single base product at KES 800 (plain box) with brand-label stickers in description
  if (/wooden executive boxes/i.test(header)) {
    price = 800;
    priceMin = null;
    priceMax = null;
    name = "WOODEN EXECUTIVE BOXES";
    variants = [];
  }
  // Dual-pricing cases (Casio Square, Citizen Date, Day&Date Gents & Ladies)
  else if (/per piece.*a pair/i.test(header) || /per piece/i.test(header)) {
    const prices = header.match(/(?:kes|ksh)\s*([\d,]+)/gi) || [];
    const p1 = prices[0] ? parseInt(prices[0].replace(/[^\d]/g, ''), 10) : 0;
    const p2 = prices[1] ? parseInt(prices[1].replace(/[^\d]/g, ''), 10) : p1 * 2;
    price = p1;
    priceMin = p1;
    priceMax = p2;
    name = header.replace(/(?:kes|ksh)\s*[\d,]+.*$/i, '').trim();
    variants = [
      { name: "Single Piece", priceModifier: 0 },
      { name: "Couple Pair (2 Watches)", priceModifier: p2 - p1 }
    ];
  } else if (/couple set/i.test(header) && (header.match(/(?:kes|ksh)\s*[\d,]+/gi) || []).length > 1) {
    const prices = header.match(/(?:kes|ksh)\s*([\d,]+)/gi) || [];
    const p1 = prices[0] ? parseInt(prices[0].replace(/[^\d]/g, ''), 10) : 0;
    const p2 = prices[1] ? parseInt(prices[1].replace(/[^\d]/g, ''), 10) : p1 * 2;
    price = p1;
    priceMin = p1;
    priceMax = p2;
    name = header.replace(/(?:kes|ksh)\s*[\d,]+.*$/i, '').trim();
    variants = [
      { name: "Single Watch", priceModifier: 0 },
      { name: "Couple Set (Pair)", priceModifier: p2 - p1 }
    ];
  } else {
    const match = header.match(/(?:kes|ksh)\s*([\d,]+)/i);
    if (match) {
      price = parseInt(match[1].replace(/,/g, ''), 10);
      name = header.replace(/(?:kes|ksh)\s*[\d,]+/i, '').trim();
    }
  }

  // Clean name
  name = name.replace(/\s+/g, ' ').replace(/[-:]+$/, '').trim();

  // Rule 2: Advanced colour list detection
  const descBullets = [];
  rp.lines.forEach((l) => {
    // Check if line is a comma-separated colour list (e.g. "Gold white, Silver, Gold Green, Silver Blue(ladies analogue watch)")
    // or short colour list like "Black Brown"
    const cleanedLine = l.replace(/\s*\(.*?\)/g, '').trim();
    const isColourList = /^(gold|silver|black|blue|green|white|pink|red|brown|cream|grey|gray|two-tone|rose gold|orange|yellow|metallic)/i.test(cleanedLine) &&
      (cleanedLine.includes(',') || cleanedLine.split(/\s+/).length <= 4);

    if (isColourList && !cleanedLine.toLowerCase().includes('water') && !cleanedLine.toLowerCase().includes('strap') && !cleanedLine.toLowerCase().includes('stainless')) {
      const parts = cleanedLine.includes(',')
        ? cleanedLine.split(',').map(s => s.trim()).filter(Boolean)
        : cleanedLine.split(/\s+/).filter(Boolean);

      if (parts.length > 1) {
        extractedColours = parts;
        // Keep the full line with spec note in description if it contains extra details like "(ladies analogue watch)"
        if (l.includes('(')) {
          const noteMatch = l.match(/\((.*?)\)/);
          if (noteMatch) descBullets.push(noteMatch[1]);
        }
        return;
      }
    }

    // Check for implied colours note without names e.g. "3 colours", "4 colours"
    if (/\b\d+\s*(?:colours|colors)\b/i.test(l)) {
      impliedColoursNote = l;
      descBullets.push(l);
      return;
    }

    descBullets.push(l);
  });

  const category = getCategory(name, descBullets);

  let slugBase = name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['’]/g, '')
    .replace(/[#*()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (name.toUpperCase().startsWith('VALENTINES LADIES GIFT SET') || name.toUpperCase().startsWith('VALENTINES COUPLE GIFT SET')) {
    slugBase = `${slugBase}-${price}`;
  }

  parsedCatalog.push({
    rawHeader: header,
    name,
    slug: slugBase,
    price,
    priceMin,
    priceMax,
    category,
    descBullets,
    variants,
    extractedColours,
    impliedColoursNote,
    matchedImages: []
  });
});

console.log('Sample parsed catalog items:');
console.log('1. Wooden Executive Boxes:', parsedCatalog.find(p => p.name.includes('WOODEN EXECUTIVE')));
console.log('2. Curren Ladies #9097:', parsedCatalog.find(p => p.name.includes('#9097')));
console.log('3. Casio Square:', parsedCatalog.find(p => p.name.includes('CASIO SQUARE')));

fs.writeFileSync('temp_docx/parsed_catalog_v2.json', JSON.stringify(parsedCatalog, null, 2));
