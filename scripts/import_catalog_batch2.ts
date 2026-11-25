import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

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

const taxonomyCategories = [
  {
    name: "Men's Watches",
    slug: "watches-men",
    description: "Premium analogue, chronograph, skeleton automatic and quartz timepieces for gentlemen.",
    image: "/products/hublot-automatic-gents-watch-blue.jpg"
  },
  {
    name: "Ladies' Watches",
    slug: "watches-ladies",
    description: "Elegant, sophisticated, iced and minimalist timepieces tailored for ladies.",
    image: "/products/curren-ladies-9097-metallic-gold-white.jpg"
  },
  {
    name: "Couple / Unisex Watch Sets",
    slug: "watches-couple-sets",
    description: "Matching pairs and sets for couples celebrating love and shared moments.",
    image: "/products/casio-square-black.jpg"
  },
  {
    name: "Smart Watches",
    slug: "smart-watches",
    description: "Next-generation smartwatches with health tracking, Bluetooth calling, and multi-sport features.",
    image: "/products/y13-fitness-smartwatch-waterproof.jpg"
  },
  {
    name: "Perfumes & Fragrances",
    slug: "perfumes-fragrances",
    description: "Authentic luxury Arabian fragrances, oud moods, and signature perfume sets.",
    image: "/products/amber-oud-by-haramain-perfumes.jpg"
  },
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
    name: "Jewellery",
    slug: "jewellery",
    description: "Exquisite necklaces, bracelets, and tarnish-free engravable stainless steel jewellery sets.",
    image: "/products/4-pc-matching-jewellery-sets-green.jfif"
  },
  {
    name: "Accessories & Gift Boxes",
    slug: "accessories-gift-boxes",
    description: "Wooden executive watch presentation boxes, organizers, brand labels, and gift cards.",
    image: "/products/wooden-executive-boxes.jpg"
  },
  {
    name: "Bags & Purses",
    slug: "bags-purses",
    description: "High-quality leather purses, wallets, and functional fashion bags.",
    image: "/products/very-high-quality-ladies-purse-black.jpg"
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
  }
];

const categoryPrefixMap: Record<string, string> = {
  "watches-men": "MEN",
  "watches-ladies": "LAD",
  "watches-couple-sets": "CPL",
  "smart-watches": "SMT",
  "perfumes-fragrances": "PRF",
  "valentines-gift-sets": "VAL",
  "mothers-day-gift-sets": "MDG",
  "jewellery": "JWL",
  "accessories-gift-boxes": "ACC",
  "bags-purses": "BAG"
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
  if (n.includes("gold pink")) return "GPNK";
  if (n.includes("gold red")) return "GRED";
  if (n.includes("gold purple")) return "GPRP";
  if (n.includes("gold black") || n.includes("gold - black")) return "GBLK";
  if (n.includes("silver gold")) return "SGLD";
  if (n.includes("silver white")) return "SWHT";
  if (n.includes("silver beads") || n.includes("silve beads")) return "SBDS";
  if (n.includes("diamond")) return "DMD";
  if (n.includes("shiny black") || n.includes("black shiny")) return "SBLK";
  if (n.includes("gold screen")) return "GSCR";
  if (n.includes("black blue") || n.includes("black - blue")) return "BBLU";
  if (n.includes("black gold") || n.includes("black - gold")) return "BGLD";
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
  if (n.includes("purple")) return "PRP";

  const clean = name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
  return clean || `V${index + 1}`;
}

const dedicatedBatchMap: Record<string, string[]> = {
  "michael-kors-mk-chronograph": [
    "MICHAEL KORS (MK) CHRONOGRAPH(black).jfif",
    "MICHAEL KORS (MK) CHRONOGRAPH(blue).jfif",
    "MICHAEL KORS (MK) CHRONOGRAPH(gold).jfif",
    "MICHAEL KORS (MK) CHRONOGRAPH(green).jfif"
  ],
  "lige-lg8963a": [
    "LIGE LG8963A.jfif",
    "LIGE LG8963A(1).jfif"
  ],
  "daniel-wellington": [
    "DANIEL WELLINGTON(gold screen).jfif",
    "DANIEL WELLINGTON(gold).jfif",
    "DANIEL WELLINGTON(gold- silver).jfif",
    "DANIEL WELLINGTON(silver- black).jfif"
  ],
  "opk-couple-watch": [
    "OPK COUPLE WATCH(gold).jfif",
    "OPK COUPLE WATCH(silver - black).jfif",
    "OPK COUPLE WATCH(silver).jfif"
  ],
  "poedagar-gents": [
    "Poedagar Gents(black).jfif"
  ],
  "casio-digital": [
    "CASIO DIGITAL( gold - black).jfif",
    "CASIO DIGITAL(black - shiny).jfif",
    "CASIO DIGITAL(black).jfif",
    "CASIO DIGITAL(gold -  pink).jfif",
    "CASIO DIGITAL(gold).jfif",
    "CASIO DIGITAL(shiny  - black).jfif"
  ],
  "ochstin-chronograph-gents-watch": [
    "OCHSTIN  CHRONOGRAPH GENTS WATCH(black -  blue).jfif",
    "OCHSTIN  CHRONOGRAPH GENTS WATCH(black - gold).jfif",
    "OCHSTIN  CHRONOGRAPH GENTS WATCH(black).jfif",
    "OCHSTIN  CHRONOGRAPH GENTS WATCH(brown).jfif"
  ],
  "curren-gents-8301": [
    "CURREN GENTS 8301.jfif"
  ],
  "school-digital-casio": [
    "SCHOOL DIGITAL CASIO.jfif",
    "SCHOOL DIGITAL CASIO(blue).jfif"
  ],
  "oruss-ladies-day-and-date": [
    "ORUSS LADIES DAY & DATE(gold  -purple).jfif",
    "ORUSS LADIES DAY & DATE(gold).jfif",
    "ORUSS LADIES DAY & DATE(pink).jfif"
  ],
  "casio-unisex": [
    "CASIO UNISEX(gold - green).jfif",
    "CASIO UNISEX(gold- pink).jfif",
    "CASIO UNISEX(silver - gold).jfif"
  ],
  "olevs-ladies-watch": [
    "OLEVS LADIES WATCH(gold - pink).jfif",
    "OLEVS LADIES WATCH(gold - red).jfif",
    "OLEVS LADIES WATCH(gold - white).jfif",
    "OLEVS LADIES WATCH(gold -green).jfif",
    "OLEVS LADIES WATCH(gold- brown).jfif"
  ],
  "naviforce-gents-watch-nf-9117": [
    "NAVIFORCE GENTS WATCH #NF 9117(black).jfif",
    "NAVIFORCE GENTS WATCH #NF 9117(gold).jfif",
    "NAVIFORCE GENTS WATCH #NF 9117(silver).jfif"
  ],
  "pro-9-gs-smart-watch": [
    "PRO 9 GS SMART WATCH.jfif"
  ],
  "daniel-wellington-ladies-watch-x-bracelet": [
    "DANIEL WELLINGTON LADIES WATCH X BRACELET(black).jfif",
    "DANIEL WELLINGTON LADIES WATCH X BRACELET(gold - green).jfif",
    "DANIEL WELLINGTON LADIES WATCH X BRACELET(gold -black).jfif",
    "DANIEL WELLINGTON LADIES WATCH X BRACELET(gold -blue).jfif",
    "DANIEL WELLINGTON LADIES WATCH X BRACELET(gold).jfif",
    "DANIEL WELLINGTON LADIES WATCH X BRACELET(green).jfif",
    "DANIEL WELLINGTON LADIES WATCH X BRACELET(silver - white).jfif",
    "DANIEL WELLINGTON LADIES WATCH X BRACELET(silver -black).jfif",
    "DANIEL WELLINGTON LADIES WATCH X BRACELET(silver).jfif",
    "DANIEL WELLINGTON LADIES WATCH X BRACELET(silver- blue).jfif"
  ],
  "twin-box-available": [],
  "3-in-1-detachable-ladies-necklace": [
    "3 IN 1 DETACHABLE LADIES NECKLACE.jfif"
  ],
  "curren-gents-watch-8365": [
    "CURREN  GENTS WATCH #8365(black).jfif",
    "CURREN  GENTS WATCH #8365(blue).jfif"
  ],
  "curren-branded-box": [],
  "3-in-1-olevs-gift-set": [
    "3 IN 1 OLEVS GIFT SET (blue).jfif",
    "3 IN 1 OLEVS GIFT SET (gold).jfif",
    "3 IN 1 OLEVS GIFT SET (orange).jfif",
    "3 IN 1 OLEVS GIFT SET (purple).jfif",
    "3 IN 1 OLEVS GIFT SET (white).jfif"
  ],
  "naviforce-nf8051": [
    "NAVIFORCE  NF8051(black).jfif",
    "NAVIFORCE  NF8051(blue).jfif",
    "NAVIFORCE  NF8051(green).jfif",
    "NAVIFORCE  NF8051(white).jfif"
  ],
  "opk-gents-watch-8152": [
    "OPK GENTS WATCH #8152(black).jfif",
    "OPK GENTS WATCH #8152(silver).jfif",
    "OPK GENTS WATCH #8152(silver- black).jfif"
  ],
  "poedagar-gents-watch": [
    "POEDAGAR GENTS WATCH(black).jfif",
    "POEDAGAR GENTS WATCH(blue).jfif",
    "POEDAGAR GENTS WATCH(green).jfif",
    "POEDAGAR GENTS WATCH(white).jfif"
  ],
  "d18-smart-watch-gs": [
    "D18  SMART WATCH GS.jfif"
  ],
  "4pc-matching-jewellery-sets-1600": [
    "4pc Matching Jewellery Sets(diamond).jfif",
    "4pc Matching Jewellery Sets(gold).jfif",
    "4pc Matching Jewellery Sets(green).jfif",
    "4pc Matching Jewellery Sets(red).jfif",
    "4pc Matching Jewellery Sets(silve beads).jfif",
    "4pc Matching Jewellery Sets(silver).jfif"
  ],
  "4-pc-matching-jewellery-sets-1400": [
    "4 PC MATCHING JEWELLERY SETS(green).jfif",
    "4 PC MATCHING JEWELLERY SETS(red).jfif",
    "4 PC MATCHING JEWELLERY SETS(white).jfif"
  ],
  "skmei-men-digital-2353": [
    "SKMEI Men Digital 2353(gold).jfif",
    "SKMEI Men Digital 2353(gold1).jfif",
    "SKMEI Men Digital 2353(silver).jfif",
    "SKMEI Men Digital 2353(silver1).jfif"
  ],
  "oruss-men-date-watch": [
    "ORUSS MEN DATE WATCH(black).jfif",
    "ORUSS MEN DATE WATCH(gold).jfif",
    "ORUSS MEN DATE WATCH(white).jfif"
  ],
  "curren-ladies-9051": [
    "CURREN LADIES #9051(blue).jfif",
    "CURREN LADIES #9051(pink).jfif",
    "CURREN LADIES #9051(white).jfif"
  ],
  "opk-gents-watch-8172": [
    "OPK GENTS WATCH #8172(silver).jfif",
    "OPK GENTS WATCH #8172.jfif"
  ],
  "elegant-matching-jewellery-sets": [
    "ELEGANT MATCHING JEWELLERY SETS(black).jfif",
    "ELEGANT MATCHING JEWELLERY SETS(blue).jfif",
    "ELEGANT MATCHING JEWELLERY SETS(green).jfif",
    "ELEGANT MATCHING JEWELLERY SETS(white)).jfif"
  ]
};

function inferCategory(name: string, descBullets: string[]): { name: string; slug: string } {
  const n = name.toLowerCase().replace(/\s+/g, " ");
  const d = descBullets.join(" ").toLowerCase().replace(/\s+/g, " ");

  if (n.includes("3 in 1 olevs gift set") || (n.includes("gift set") && n.includes("bag"))) {
    return { name: "Valentine's Gift Sets", slug: "valentines-gift-sets" };
  }
  if (n.includes("smart watch") || n.includes("smartwatch") || d.includes("smart watch features") || d.includes("sports mode recording")) {
    return { name: "Smart Watches", slug: "smart-watches" };
  }
  if (n.includes("jewellery") || n.includes("jewelry") || n.includes("necklace") || (d.includes("necklace") && d.includes("earrings"))) {
    return { name: "Jewellery", slug: "jewellery" };
  }
  if (n.includes("box") || n.includes("gift cards")) {
    return { name: "Accessories & Gift Boxes", slug: "accessories-gift-boxes" };
  }
  if (n.includes("couple") || n.includes("unisex") || d.includes("a couple pair") || d.includes("ladies/men")) {
    return { name: "Couple / Unisex Watch Sets", slug: "watches-couple-sets" };
  }
  if (n.includes("ladies") || n.includes("michael kors") || d.includes("ladies analogue") || d.includes("ladies watch") || d.includes("ladies")) {
    return { name: "Ladies' Watches", slug: "watches-ladies" };
  }
  return { name: "Men's Watches", slug: "watches-men" };
}

export async function importBatch2Catalog() {
  console.log("Starting catalog import for batch 2 from product.docx...");

  // 1. Process and copy all source images to public/products
  const srcDir = path.join(process.cwd(), "public", "product");
  const destDir = path.join(process.cwd(), "public", "products");

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const rawImageFiles = fs.existsSync(srcDir)
    ? fs.readdirSync(srcDir).filter((f) => !fs.statSync(path.join(srcDir, f)).isDirectory())
    : [];

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

  console.log(`Copied and slugified ${rawImageFiles.length} images into /public/products/`);

  // 2. Ensure categories exist
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

  // 3. Load SKU Counters from existing database state
  const existingProducts = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, sku: true }
  });

  const categoryCounters: Record<string, number> = {};
  existingProducts.forEach((p) => {
    const parts = p.sku.split("-");
    if (parts.length >= 3) {
      const prefix = parts[1];
      const num = parseInt(parts[2], 10);
      if (!isNaN(num)) {
        categoryCounters[prefix] = Math.max(categoryCounters[prefix] || 0, num);
      }
    }
  });

  // 4. Parse XML paragraphs from product.docx
  let lines: string[] = [];
  if (fs.existsSync("temp_docx_product/word/document.xml")) {
    const xml = fs.readFileSync("temp_docx_product/word/document.xml", "utf8");
    const pMatches = xml.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) || [];
    for (const p of pMatches) {
      const tMatches = p.match(/<w:t[\s>][\s\S]*?<\/w:t>/g) || [];
      const text = tMatches.map((t) => t.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, "")).join("");
      if (text.trim()) {
        lines.push(text.trim());
      }
    }
  } else if (fs.existsSync("scratch_product_paragraphs.json")) {
    lines = JSON.parse(fs.readFileSync("scratch_product_paragraphs.json", "utf8"));
  }

  // 5. Build Product Blocks
  function isProductHeader(line: string): boolean {
    if (/(?:kes|ksh)\s*[\d,]+/i.test(line)) {
      if (/brand labels/i.test(line) && /sticker/i.test(line)) return false;
      return true;
    }
    return false;
  }

  const rawProducts: Array<{ header: string; lines: string[] }> = [];
  let currentBlock: { header: string; lines: string[] } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
    if (!line) continue;

    if (isProductHeader(line)) {
      if (currentBlock) rawProducts.push(currentBlock);
      currentBlock = { header: line, lines: [] };
    } else {
      if (currentBlock) {
        currentBlock.lines.push(line);
      }
    }
  }
  if (currentBlock) rawProducts.push(currentBlock);

  console.log(`Parsed ${rawProducts.length} product blocks from product.docx.`);

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < rawProducts.length; i++) {
    const rp = rawProducts[i];
    const header = rp.header;

    let price = 0;
    const priceMatch = header.match(/(?:kes|ksh)\s*([\d,]+)/i);
    if (priceMatch) {
      price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
    }

    let name = header.replace(/(?:kes|ksh)\s*[\d,]+.*$/i, "").trim();
    name = name.replace(/\s+/g, " ").replace(/[-:*]+$/, "").trim();

    const descBullets = rp.lines.map((l) => l.trim()).filter(Boolean);
    const category = inferCategory(name, descBullets);
    const catId = categoryMap[category.slug];
    const catPrefix = categoryPrefixMap[category.slug] || "PRD";

    let slugBase = name
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/['’]/g, "")
      .replace(/[#*()]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (name.toUpperCase().startsWith("4PC MATCHING JEWELLERY SETS") || name.toUpperCase().startsWith("4 PC MATCHING JEWELLERY SETS")) {
      slugBase = `${slugBase}-${price}`;
    }

    // Match images using dedicated map or fallback
    let rawMatchedImages: string[] = dedicatedBatchMap[slugBase] || [];
    if (rawMatchedImages.length === 0 && dedicatedBatchMap[slugBase.replace(/-\d+$/, "")] !== undefined) {
      rawMatchedImages = dedicatedBatchMap[slugBase.replace(/-\d+$/, "")];
    }

    const slugifiedImages = rawMatchedImages.map(
      (orig) => originalToSlugUrl.get(orig) || `/products/${slugifyImageName(orig)}`
    );

    // Derive variants from images
    let variants: Array<{ name: string; priceModifier: number; image?: string | null }> = [];
    if (slugifiedImages.length > 1) {
      variants = rawMatchedImages.map((imgOrig, iIdx) => {
        const colMatch = imgOrig.match(/\((.*?)\)/);
        let varName = colMatch ? colMatch[1].replace(/[^a-zA-Z0-9\s-]/g, "").trim() : `Option ${iIdx + 1}`;
        if (!varName || varName.toLowerCase() === "1") {
          varName = `Option ${iIdx + 1}`;
        }
        return {
          name: varName.charAt(0).toUpperCase() + varName.slice(1),
          priceModifier: 0,
          image: slugifiedImages[iIdx]
        };
      });
    }

    const descriptionText = descBullets.map((b) => `• ${b}`).join("\n");
    const isActive = slugifiedImages.length > 0;
    const parentStock = slugifiedImages.length === 0 ? 0 : variants.length > 0 ? variants.length * 10 : 15;
    const statusNote = slugifiedImages.length === 0 ? "Awaiting product photography" : null;

    // Check if product already exists
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ slug: slugBase }, { name: { equals: name, mode: "insensitive" } }]
      }
    });

    if (existing) {
      console.log(`Product already exists: "${existing.name}" (slug: ${existing.slug}, sku: ${existing.sku}). Preserving existing.`);
      skippedCount++;
      continue;
    }

    // Generate next sequential SKU
    categoryCounters[catPrefix] = (categoryCounters[catPrefix] || 0) + 1;
    const productNumStr = String(categoryCounters[catPrefix]).padStart(3, "0");
    const productSku = `MWB-${catPrefix}-${productNumStr}`;

    const createdProduct = await prisma.product.create({
      data: {
        name,
        slug: slugBase,
        description: descriptionText,
        price,
        priceMin: null,
        priceMax: null,
        categoryId: catId,
        images: slugifiedImages,
        stock: parentStock,
        sku: productSku,
        isNew: true,
        isFeatured: false,
        isHotDeal: false,
        isActive,
        statusNote
      }
    });

    for (let vIdx = 0; vIdx < variants.length; vIdx++) {
      const v = variants[vIdx];
      const varCode = getVariantCode(v.name, vIdx);
      const variantSku = `MWB-${catPrefix}-${productNumStr}-V${vIdx + 1}-${varCode}`;

      await prisma.productVariant.create({
        data: {
          productId: createdProduct.id,
          name: v.name,
          image: v.image || slugifiedImages[0] || null,
          priceModifier: v.priceModifier,
          stock: 10,
          sku: variantSku
        }
      });
    }

    insertedCount++;
    console.log(`Inserted [${insertedCount}] "${createdProduct.name}" (SKU: ${createdProduct.sku}, Variants: ${variants.length})`);
  }

  console.log(`\nImport complete. Inserted: ${insertedCount}, Skipped: ${skippedCount}, Updated: ${updatedCount}`);
  return { insertedCount, skippedCount, updatedCount };
}

if (require.main === module) {
  importBatch2Catalog()
    .catch((e) => {
      console.error("Import failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
