import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// 1. Slugify helper for lowercase destination images
function slugifyImageName(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext);

  const slug = base
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[_]/g, "-")
    .replace(/[#*]/g, "")
    .replace(/\(\s*\)/g, "")
    .replace(/[\(\)]/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug}${ext}`;
}

// 2. Taxonomy categories
const taxonomyCategories = [
  {
    name: "Valentine's Gift Sets",
    slug: "valentines-gift-sets",
    description: "Romantic luxury gift hampers, timepiece pairings, chocolates, and preserved roses.",
    image: "/products/valentines-men-gift-set.jpg"
  },
  {
    name: "Mother's Day Gift Sets",
    slug: "mothers-day-gift-sets",
    description: "Curated gift packs featuring jewellery, Arabian perfumes, watches, and pampering essentials.",
    image: "/products/6-in-1-mothers-day-gift-pack.jpg"
  },
  {
    name: "Watches – Men",
    slug: "watches-men",
    description: "Precision analogue, chronograph, skeleton automatic and quartz timepieces for gentlemen.",
    image: "/products/casio-edifice-gents-watch-black.jpg"
  },
  {
    name: "Watches – Ladies",
    slug: "watches-ladies",
    description: "Elegant, sophisticated, iced and minimalist timepieces tailored for ladies.",
    image: "/products/curren-ladies-9097-metallic-gold-white.jpg"
  },
  {
    name: "Watches – Couple Sets",
    slug: "watches-couple-sets",
    description: "Matching pairs and sets for couples celebrating love and shared moments.",
    image: "/products/casio-square-black.jpg"
  },
  {
    name: "Smart Watches",
    slug: "smart-watches",
    description: "Next-generation smartwatches with health tracking, Bluetooth calling, and multi-sport features.",
    image: "/products/z12-pro-smart-watch.jpg"
  },
  {
    name: "Perfumes & Fragrances",
    slug: "perfumes-fragrances",
    description: "Authentic luxury Arabian fragrances, oud moods, and signature perfume sets.",
    image: "/products/amber-oud-by-haramain-perfumes.jpg"
  },
  {
    name: "Jewellery",
    slug: "jewellery",
    description: "Exquisite necklaces, bracelets, and tarnish-free engravable stainless steel jewellery sets.",
    image: "/products/stainless-steel-3pc-jewellery-sets-heart.jpg"
  },
  {
    name: "Accessories & Gift Boxes",
    slug: "accessories-gift-boxes",
    description: "Wooden executive watch presentation boxes, brand labels, and elegant gift cards.",
    image: "/products/wooden-executive-boxes.jpg"
  },
  {
    name: "Analogue Watches",
    slug: "analogue-watches",
    description: "Precision quartz, automatic and mechanical analogue timepieces designed with classic elegance.",
    image: "/analoguewatchs.jpg"
  },
  {
    name: "Digital Watches",
    slug: "digital-watches",
    description: "Multi-function digital, dual-time and world-time wristwatches with backlight, alarms and chronographs.",
    image: "/digitalwatch.webp"
  },
  {
    name: "Gifts & Accessories",
    slug: "gifts-accessories",
    description: "Curated gift bundles, Arabian perfumes, jewellery, executive boxes, leather bags and watch organizers.",
    image: "/products/valentines-men-gift-set.jpg"
  }
];

const categoryPrefixMap: Record<string, string> = {
  "valentines-gift-sets": "VAL",
  "mothers-day-gift-sets": "MDG",
  "watches-men": "MEN",
  "watches-ladies": "LAD",
  "watches-couple-sets": "CPL",
  "smart-watches": "SMT",
  "perfumes-fragrances": "PRF",
  "jewellery": "JWL",
  "accessories-gift-boxes": "ACC"
};

function getVariantCode(name: string, index: number): string {
  const n = name.toLowerCase();

  if (n.includes("single")) return "SNG";
  if (n.includes("couple") || n.includes("pair")) return "CPL";
  if (n.includes("gold white") || n.includes("white gold")) return "GWHT";
  if (n.includes("gold green")) return "GGRN";
  if (n.includes("silver blue")) return "SBLU";
  if (n.includes("silver black")) return "SBLK";
  if (n.includes("gold brown")) return "GBRN";
  if (n.includes("two-tone") || n.includes("two tone")) return "TTN";
  if (n.includes("rose gold")) return "RSG";
  if (n.includes("gold")) return "GLD";
  if (n.includes("silver")) return "SLV";
  if (n.includes("green")) return "GRN";
  if (n.includes("grey") || n.includes("gray")) return "GRY";
  if (n.includes("black")) return "BLK";
  if (n.includes("blue")) return "BLU";
  if (n.includes("brown")) return "BRN";
  if (n.includes("beige") || n.includes("cream")) return "BGE";
  if (n.includes("white")) return "WHT";
  if (n.includes("pink")) return "PNK";
  if (n.includes("red")) return "RED";
  if (n.includes("orange")) return "ORG";
  if (n.includes("animal print")) return "ANM";
  if (n.includes("elegant")) return "ELG";
  if (n.includes("butterfly")) return "BTF";
  if (n.includes("flower")) return "FLW";
  if (n.includes("heart")) return "HRT";
  if (n.includes("elixir")) return "ELX";
  if (n.includes("fire")) return "FIR";
  if (n.includes("ice")) return "ICE";
  if (n.includes("man")) return "MAN";
  if (n.includes("woman")) return "WOM";

  const clean = name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
  return clean || `V${index + 1}`;
}

export async function importCatalog() {
  console.log("Starting catalog import from productss.docx and public/PRODUCTSs/...");

  // 1. Process and lowercase all image files
  const srcDir = path.join(process.cwd(), "public", "PRODUCTSs");
  const destDir = path.join(process.cwd(), "public", "products");

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const rawImageFiles = fs.readdirSync(srcDir).filter((f) => !fs.statSync(path.join(srcDir, f)).isDirectory());
  const originalToSlugUrl = new Map<string, string>();
  const slugCounts = new Map<string, number>();

  rawImageFiles.forEach((file) => {
    let slugName = slugifyImageName(file);

    if (slugCounts.has(slugName)) {
      const count = (slugCounts.get(slugName) || 1) + 1;
      slugCounts.set(slugName, count);
      const ext = path.extname(slugName);
      const base = path.basename(slugName, ext);
      slugName = `${base}-${count}${ext}`;
    } else {
      slugCounts.set(slugName, 1);
    }

    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, slugName);

    fs.copyFileSync(srcPath, destPath);
    originalToSlugUrl.set(file, `/products/${slugName}`);
  });

  console.log(`Copied and slugified ${rawImageFiles.length} images into strictly lowercase /public/products/`);

  // 2. Seed Categories
  const categoryMap: Record<string, string> = {};
  for (const cat of taxonomyCategories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        image: cat.image
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image
      }
    });
    categoryMap[cat.slug] = record.id;
  }
  console.log(`Upserted ${Object.keys(categoryMap).length} categories in database.`);

  // 3. Parse docx XML paragraphs
  let lines: string[] = [];
  if (fs.existsSync("temp_docx_productss/word/document.xml")) {
    const xml = fs.readFileSync("temp_docx_productss/word/document.xml", "utf8");
    const pMatches = xml.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) || [];
    for (const p of pMatches) {
      const tMatches = p.match(/<w:t[\s>][\s\S]*?<\/w:t>/g) || [];
      const text = tMatches.map((t) => t.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, "")).join("");
      if (text.trim()) {
        lines.push(text.trim());
      }
    }
  } else {
    lines = JSON.parse(fs.readFileSync("temp_docx/extracted_productss_paragraphs.json", "utf8"));
  }

  // 4. Build Product Blocks
  const rawProducts: Array<{ header: string; lines: string[] }> = [];
  let currentBlock: { header: string; lines: string[] } | null = null;

  function isProductHeader(line: string): boolean {
    if (/(?:kes|ksh)\s*[\d,]+/i.test(line)) {
      if (/brand labels/i.test(line) && /sticker/i.test(line)) return false;
      return true;
    }
    return false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
    if (!line) continue;

    if (isProductHeader(line)) {
      if (currentBlock) rawProducts.push(currentBlock);
      currentBlock = { header: line, lines: [] };
    } else {
      if (line.includes("PERFUME SETS 30Ml per bottle")) continue;
      if (currentBlock) {
        currentBlock.lines.push(line);
      }
    }
  }
  if (currentBlock) rawProducts.push(currentBlock);

  console.log(`Parsed ${rawProducts.length} product blocks from document.`);

  // Dedicated image assignment dictionary
  const dedicatedMap: Record<string, string[]> = {
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

  function getCategory(name: string, descBullets: string[]): { name: string; slug: string } {
    const n = name.toLowerCase();
    const d = descBullets.join(" ").toLowerCase();

    if (n.startsWith("valentines") || n.includes("valentines gift") || n.includes("valentines men gift") || n.includes("valentines ladies gift") || n.includes("valentines couple gift")) {
      return { name: "Valentine's Gift Sets", slug: "valentines-gift-sets" };
    }
    if (n.startsWith("mothers day") || n.includes("mothers day gift") || n.includes("6 in 1 mothers day")) {
      return { name: "Mother's Day Gift Sets", slug: "mothers-day-gift-sets" };
    }
    if (n.includes("smartwatch") || n.includes("smart watch") || n.includes("smart band") || d.includes("smartwatch") || d.includes("smart watch") || d.includes("pedometer") || d.includes("heart rate")) {
      return { name: "Smart Watches", slug: "smart-watches" };
    }
    if (n.includes("perfume") || n.includes("fragrance") || n.includes("100ml") || n.includes("75ml") || n.includes("70ml") || n.includes("200ml") || n.includes("90ml") || n.includes("30ml") || n.includes("oud") || d.includes("unforgettable fragrance") || d.includes("signature fragrance") || d.includes("bold and unforgettable") || n.includes("club de nuit") || n.includes("afnan") || n.includes("ameerat") || n.includes("mousuf") || n.includes("azzaro") || n.includes("hawas") || n.includes("nebras") || n.includes("odyssey") || n.includes("orientica") || n.includes("jameela") || n.includes("liquid brun")) {
      return { name: "Perfumes & Fragrances", slug: "perfumes-fragrances" };
    }
    if (n.includes("necklace") || n.includes("jewellery set") || n.includes("jewelry set") || n.includes("earrings") || (n.includes("bracelet") && !n.includes("watch") && !n.includes("rolex"))) {
      return { name: "Jewellery", slug: "jewellery" };
    }
    if (n.includes("wooden executive") || n.includes("gift box") || n.includes("gift card") || (n.includes("box") && !n.includes("set") && !n.includes("pack"))) {
      return { name: "Accessories & Gift Boxes", slug: "accessories-gift-boxes" };
    }
    if (n.includes("couple") || (n.includes("per piece") && n.includes("pair")) || n.includes("gents and ladies watches") || d.includes("men+ladies") || d.includes("men+women") || d.includes("couple watch") || d.includes("unisex(analogue)")) {
      return { name: "Watches – Couple Sets", slug: "watches-couple-sets" };
    }
    if (n.includes("ladies") || n.includes("lady") || d.includes("ladies analogue") || d.includes("ladies watch") || d.includes("perfect gift to her")) {
      return { name: "Watches – Ladies", slug: "watches-ladies" };
    }
    return { name: "Watches – Men", slug: "watches-men" };
  }

  // Clear existing product data for fresh, collision-free database state
  console.log("Clearing existing products for fresh seed...");
  await prisma.productVariant.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.product.deleteMany({});

  const categoryCounters: Record<string, number> = {};
  const unmatchedProducts: string[] = [];
  const splitProducts: Array<{ name: string; reason: string }> = [];
  const impliedColoursList: Array<{ name: string; note: string }> = [];

  let totalInserted = 0;

  for (let i = 0; i < rawProducts.length; i++) {
    const rp = rawProducts[i];
    const header = rp.header;

    let name = header;
    let price = 0;
    let priceMin: number | null = null;
    let priceMax: number | null = null;
    let variants: Array<{ name: string; priceModifier: number; image?: string | null }> = [];
    let extractedColours: string[] = [];
    let impliedNote: string | null = null;

    // Rule 1: WOODEN EXECUTIVE BOXES as single product at KES 800
    if (/wooden executive boxes/i.test(header)) {
      price = 800;
      priceMin = null;
      priceMax = null;
      name = "WOODEN EXECUTIVE BOXES";
      variants = [];
    }
    // Dual pricing cases
    else if (/per piece.*a pair/i.test(header) || /per piece/i.test(header)) {
      const prices = header.match(/(?:kes|ksh)\s*([\d,]+)/gi) || [];
      const p1 = prices[0] ? parseInt(prices[0].replace(/[^\d]/g, ""), 10) : 0;
      const p2 = prices[1] ? parseInt(prices[1].replace(/[^\d]/g, ""), 10) : p1 * 2;
      price = p1;
      priceMin = p1;
      priceMax = p2;
      name = header.replace(/(?:kes|ksh)\s*[\d,]+.*$/i, "").trim();
      variants = [
        { name: "Single Piece", priceModifier: 0 },
        { name: "Couple Pair (2 Watches)", priceModifier: p2 - p1 }
      ];
      splitProducts.push({ name, reason: `Dual-pricing detected: KES ${p1} per piece vs KES ${p2} per pair. Seeded with priceMin/priceMax and single/pair variants.` });
    } else if (/couple set/i.test(header) && (header.match(/(?:kes|ksh)\s*[\d,]+/gi) || []).length > 1) {
      const prices = header.match(/(?:kes|ksh)\s*([\d,]+)/gi) || [];
      const p1 = prices[0] ? parseInt(prices[0].replace(/[^\d]/g, ""), 10) : 0;
      const p2 = prices[1] ? parseInt(prices[1].replace(/[^\d]/g, ""), 10) : p1 * 2;
      price = p1;
      priceMin = p1;
      priceMax = p2;
      name = header.replace(/(?:kes|ksh)\s*[\d,]+.*$/i, "").trim();
      variants = [
        { name: "Single Watch", priceModifier: 0 },
        { name: "Couple Set (Pair)", priceModifier: p2 - p1 }
      ];
      splitProducts.push({ name, reason: `Dual-pricing detected: KES ${p1} single watch vs KES ${p2} couple set. Seeded with priceMin/priceMax and single/couple set variants.` });
    } else {
      const match = header.match(/(?:kes|ksh)\s*([\d,]+)/i);
      if (match) {
        price = parseInt(match[1].replace(/,/g, ""), 10);
        name = header.replace(/(?:kes|ksh)\s*[\d,]+/i, "").trim();
      }
    }

    name = name.replace(/\s+/g, " ").replace(/[-:]+$/, "").trim();

    // Rule 2: In-body comma-separated colour list parsing
    const descBullets: string[] = [];
    rp.lines.forEach((l) => {
      const cleanedLine = l.replace(/\s*\(.*?\)/g, "").trim();
      const isColourList =
        /^(gold|silver|black|blue|green|white|pink|red|brown|cream|grey|gray|two-tone|rose gold|orange|yellow|metallic)/i.test(cleanedLine) &&
        (cleanedLine.includes(",") || cleanedLine.split(/\s+/).length <= 4);

      if (isColourList && !cleanedLine.toLowerCase().includes("water") && !cleanedLine.toLowerCase().includes("strap") && !cleanedLine.toLowerCase().includes("stainless")) {
        const parts = cleanedLine.includes(",")
          ? cleanedLine.split(",").map((s) => s.trim()).filter(Boolean)
          : cleanedLine.split(/\s+/).filter(Boolean);

        if (parts.length > 1) {
          extractedColours = parts;
          if (l.includes("(")) {
            const noteMatch = l.match(/\((.*?)\)/);
            if (noteMatch) descBullets.push(noteMatch[1]);
          }
          return;
        }
      }

      if (/\b\d+\s*(?:colours|colors)\b/i.test(l)) {
        impliedNote = l;
      }

      descBullets.push(l);
    });

    const category = getCategory(name, descBullets);
    const catId = categoryMap[category.slug];
    const catPrefix = categoryPrefixMap[category.slug] || "PRD";

    categoryCounters[catPrefix] = (categoryCounters[catPrefix] || 0) + 1;
    const productNumStr = String(categoryCounters[catPrefix]).padStart(3, "0");
    const productSku = `MWB-${catPrefix}-${productNumStr}`;

    let slugBase = name
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/['’]/g, "")
      .replace(/[#*()]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (name.toUpperCase().startsWith("VALENTINES LADIES GIFT SET") || name.toUpperCase().startsWith("VALENTINES COUPLE GIFT SET")) {
      slugBase = `${slugBase}-${price}`;
    }

    // Match images
    let rawMatchedImages: string[] = [];
    if (dedicatedMap[slugBase] !== undefined) {
      rawMatchedImages = dedicatedMap[slugBase];
    } else {
      const pClean = name.toLowerCase().replace(/\s*\(.*?\)/g, "").replace(/\b\d+ml\b/gi, "").replace(/[#*(),]/g, " ").replace(/&/g, "and").replace(/\s+/g, " ").trim();
      rawImageFiles.forEach((imgFile) => {
        const imgClean = path.basename(imgFile, path.extname(imgFile)).toLowerCase().replace(/\s*\(.*?\)/g, "").replace(/\b\d+ml\b/gi, "").replace(/[#*(),]/g, " ").replace(/&/g, "and").replace(/\s+/g, " ").trim();
        if (imgClean === pClean || imgClean.startsWith(pClean) || pClean.startsWith(imgClean)) {
          rawMatchedImages.push(imgFile);
          return;
        }
        const pModel = pClean.match(/\b\d{4}\b|\bnf\d+\b/);
        const imgModel = imgClean.match(/\b\d{4}\b|\bnf\d+\b/);
        if (pModel && imgModel && pModel[0] === imgModel[0]) {
          rawMatchedImages.push(imgFile);
        }
      });
      rawMatchedImages = Array.from(new Set(rawMatchedImages));
    }

    const slugifiedImages = rawMatchedImages.map((orig) => originalToSlugUrl.get(orig) || `/products/${slugifyImageName(orig)}`);

    if (slugifiedImages.length === 0) {
      unmatchedProducts.push(name);
    }

    // Derive colour variants if images or extracted colours exist and no dual-pricing variants exist
    if (variants.length === 0) {
      if (extractedColours.length > 0) {
        variants = extractedColours.map((col, cIdx) => {
          const colSlug = col.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          // Match specifically by slugified colour token
          const matchingImg =
            slugifiedImages.find((img) => {
              const base = path.basename(img, path.extname(img));
              return base.endsWith(`-${colSlug}`);
            }) ||
            slugifiedImages.find((img) => {
              const base = path.basename(img, path.extname(img));
              return base.includes(`-${colSlug}-`) || base.includes(`-${colSlug}`);
            }) ||
            slugifiedImages[cIdx] ||
            slugifiedImages[0] ||
            null;

          return {
            name: `${col}`,
            priceModifier: 0,
            image: matchingImg
          };
        });
      } else if (slugifiedImages.length > 1) {
        // Derive variants from image filenames e.g. "(black)", "(gold)"
        variants = rawMatchedImages.map((imgOrig, iIdx) => {
          const colMatch = imgOrig.match(/\((.*?)\)/);
          let varName = colMatch ? colMatch[1].replace(/[^a-zA-Z0-9\s-]/g, "").trim() : `Option ${iIdx + 1}`;
          if (!varName || varName.toLowerCase() === "specs" || varName.toLowerCase() === "spec") {
            varName = `Overview / Details`;
          }
          return {
            name: varName.charAt(0).toUpperCase() + varName.slice(1),
            priceModifier: 0,
            image: slugifiedImages[iIdx]
          };
        });
      }
    }

    if (impliedNote && variants.length === 0) {
      impliedColoursList.push({ name, note: impliedNote });
    }

    const descriptionText = descBullets.map((b) => `• ${b}`).join("\n");
    const isNew = i < 15;
    const isFeatured = [0, 1, 6, 7, 17, 30, 46, 66, 72].includes(i);
    const isHotDeal = [4, 9, 21, 32, 49, 65, 75].includes(i);
    const parentStock = slugifiedImages.length === 0 ? 0 : variants.length > 0 ? variants.length * 10 : 15;
    const isActive = slugifiedImages.length > 0;

    const product = await prisma.product.create({
      data: {
        name,
        slug: slugBase,
        description: descriptionText,
        price,
        priceMin: priceMin !== null ? priceMin : null,
        priceMax: priceMax !== null ? priceMax : null,
        categoryId: catId,
        images: slugifiedImages,
        stock: parentStock,
        sku: productSku,
        isNew,
        isFeatured,
        isHotDeal,
        isActive,
        statusNote: slugifiedImages.length === 0 ? "Awaiting product photography" : null
      }
    });

    // Create variants in database
    for (let vIdx = 0; vIdx < variants.length; vIdx++) {
      const v = variants[vIdx];
      const varCode = getVariantCode(v.name, vIdx);
      const variantSku = `MWB-${catPrefix}-${productNumStr}-V${vIdx + 1}-${varCode}`;

      await prisma.productVariant.create({
        data: {
          productId: product.id,
          name: v.name,
          image: v.image || slugifiedImages[0] || null,
          priceModifier: v.priceModifier,
          stock: 10,
          sku: variantSku
        }
      });
    }

    totalInserted++;
  }

  console.log(`\nImport completed: Inserted ${totalInserted} products.`);
  return {
    totalParsed: rawProducts.length,
    totalInserted,
    splitProducts,
    unmatchedProducts,
    impliedColoursList
  };
}

if (require.main === module) {
  importCatalog()
    .catch((e) => {
      console.error("Import failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
