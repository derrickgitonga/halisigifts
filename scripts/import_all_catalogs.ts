import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { backupAdminProducts } from "./backup_admin_products";
import { restoreAdminProducts } from "./restore_admin_products";

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
    image: "/products/colmi-p71-voice-calling-smartwatch.jpg"
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
    image: "/products/stainless-steel-3pc-jewellery-sets-heart.jpg"
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
  },
  {
    name: "Gifts & Accessories",
    slug: "gifts-accessories",
    description: "Curated gift bundles, Arabian perfumes, jewellery, executive boxes, leather bags and watch organizers.",
    image: "/products/valentines-men-gift-set.jpg"
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
  "bags-purses": "BAG",
  "mens-watches": "MEN",
  "ladies-watches": "LAD",
  "couple-unisex-watch-sets": "CPL",
  "jewellery-accessories": "JWL",
  "gift-packs-sets": "GFT",
  "watch-care-display": "ACC"
};

function getVariantCode(name: string, index: number): string {
  const n = name.toLowerCase();

  if (n.includes("single")) return "SNG";
  if (n.includes("couple") || n.includes("pair")) return "CPL";
  if (n.includes("leather")) return "LEA";
  if (n.includes("metallic")) return "MET";
  if (n.includes("converse") || n.includes("canvas")) return "CNV";
  if (n.includes("6 slots")) return "06S";
  if (n.includes("10 slots")) return "10S";
  if (n.includes("12 slots")) return "12S";
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

  const clean = name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
  return clean || `V${index + 1}`;
}

export async function importAllCatalogs() {
  console.log("=== STARTING UNIFIED CATALOG IMPORT (186 PRODUCTS) ===");

  const destDir = path.join(process.cwd(), "public", "products");
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // 1. Process all images from BOTH public/PRODUCTS and public/PRODUCTSs
  const srcDirs = [
    path.join(process.cwd(), "public", "PRODUCTS"),
    path.join(process.cwd(), "public", "PRODUCTSs")
  ];

  const originalToSlugUrl = new Map<string, string>();
  const slugToOriginalMap = new Map<string, string>();

  for (const dir of srcDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => !fs.statSync(path.join(dir, f)).isDirectory());

    files.forEach((file) => {
      let slugName = slugifyImageName(file);

      // Check if another distinct file generated the same slugName
      if (slugToOriginalMap.has(slugName) && slugToOriginalMap.get(slugName) !== file) {
        const ext = path.extname(slugName);
        const base = path.basename(slugName, ext);
        slugName = `${base}-extra${ext}`;
      }

      slugToOriginalMap.set(slugName, file);

      const srcPath = path.join(dir, file);
      const destPath = path.join(destDir, slugName);

      try {
        fs.copyFileSync(srcPath, destPath);
        originalToSlugUrl.set(file, `/products/${slugName}`);
      } catch (err) {
        // copy error
      }
    });
  }

  console.log(`Indexed and slugified ${originalToSlugUrl.size} distinct image mappings into /public/products/`);

  // 2. Upsert categories
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

  const legacySlugMap: Record<string, string> = {
    "mens-watches": categoryMap["watches-men"],
    "ladies-watches": categoryMap["watches-ladies"],
    "couple-unisex-watch-sets": categoryMap["watches-couple-sets"],
    "jewellery-accessories": categoryMap["jewellery"],
    "watch-care-display": categoryMap["accessories-gift-boxes"],
    "gift-packs-sets": categoryMap["valentines-gift-sets"]
  };

  // 3. Load both parsed catalogs
  const cat1Products: any[] = JSON.parse(fs.readFileSync("temp_docx/parsed_products_full.json", "utf8"));
  const cat2Products: any[] = JSON.parse(fs.readFileSync("temp_docx/final_matched_products.json", "utf8"));

  // Safely backup non-catalog admin products before seed
  await backupAdminProducts();

  console.log("Cleaning catalog products for fresh seed...");
  await prisma.productVariant.deleteMany({
    where: { sku: { startsWith: "MWB-" } }
  });
  await prisma.product.deleteMany({
    where: { sku: { startsWith: "MWB-" } }
  });

  const categoryCounters: Record<string, number> = {};
  let totalInserted = 0;

  function normalize(str: string): string {
    return str
      .toLowerCase()
      .replace(/&amp;/g, "and")
      .replace(/&/g, "and")
      .replace(/['’]/g, "")
      .replace(/[#*(),]/g, " ")
      .replace(/kes\s*[\d,]+/g, "")
      .replace(/ksh\s*[\d,]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  const seenNormNames = new Set<string>();

  // A. Insert Catalog 2 items first (Valentine's, Mother's Day, Wwoor, Gedi, etc.)
  for (let i = 0; i < cat2Products.length; i++) {
    const p = cat2Products[i];
    const norm = normalize(p.name);
    seenNormNames.add(norm);

    const catSlug = p.category.slug;
    const catId = categoryMap[catSlug] || legacySlugMap[catSlug] || categoryMap["watches-men"];
    const catPrefix = categoryPrefixMap[catSlug] || "PRD";

    categoryCounters[catPrefix] = (categoryCounters[catPrefix] || 0) + 1;
    const productNumStr = String(categoryCounters[catPrefix]).padStart(3, "0");
    const productSku = `MWB-${catPrefix}-${productNumStr}`;

    const rawMatched = p.matchedImages || [];
    const slugifiedImages = rawMatched.map((orig: string) => {
      return originalToSlugUrl.get(orig) || `/products/${slugifyImageName(orig)}`;
    });

    const descriptionText = (p.descBullets || []).map((b: string) => `• ${b}`).join("\n");
    const isNew = i < 15;
    const isFeatured = [0, 1, 6, 7, 17, 30, 46, 66, 72].includes(i);
    const isHotDeal = [4, 9, 21, 32, 49, 65, 75].includes(i);
    const isActive = slugifiedImages.length > 0;
    const parentStock = !isActive ? 0 : 20;

    let priceMin = p.priceMin !== undefined ? p.priceMin : null;
    let priceMax = p.priceMax !== undefined ? p.priceMax : null;

    // Wooden executive boxes is single product
    if (p.name.includes("WOODEN EXECUTIVE BOXES")) {
      priceMin = null;
      priceMax = null;
    }

    const productRecord = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: descriptionText,
        price: p.price,
        priceMin,
        priceMax,
        categoryId: catId,
        images: slugifiedImages,
        stock: parentStock,
        sku: productSku,
        isNew,
        isFeatured,
        isHotDeal,
        isActive,
        statusNote: !isActive ? "Awaiting product photography" : null
      }
    });

    // Create variants
    let variants: Array<{ name: string; priceModifier: number; image?: string | null }> = [];

    if (p.name.includes("WOODEN EXECUTIVE BOXES")) {
      variants = [];
    } else if (p.name.includes("CASIO SQUARE") || p.name.includes("CITIZEN DATE WATCH")) {
      variants = [
        { name: "Single Piece", priceModifier: 0, image: slugifiedImages[0] },
        { name: "Couple Pair (2 Watches)", priceModifier: p.price, image: slugifiedImages[1] || slugifiedImages[0] }
      ];
    } else if (p.name.includes("DAY&DATE GENTS AND LADIES WATCHES")) {
      variants = [
        { name: "Single Watch", priceModifier: 0, image: slugifiedImages[0] },
        { name: "Couple Set (Pair)", priceModifier: 1800, image: slugifiedImages[1] || slugifiedImages[0] }
      ];
    } else {
      const colourList = p.colourOptions || p.extractedColours || [];
      if (colourList.length > 0) {
        variants = colourList.map((col: string, cIdx: number) => {
          const colSlug = col.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const matchingImg =
            slugifiedImages.find((img: string) => {
              const base = path.basename(img, path.extname(img));
              return base.endsWith(`-${colSlug}`);
            }) ||
            slugifiedImages.find((img: string) => {
              const base = path.basename(img, path.extname(img));
              return base.includes(`-${colSlug}-`) || base.includes(`-${colSlug}`);
            }) ||
            slugifiedImages[cIdx] ||
            slugifiedImages[0] ||
            null;

          return {
            name: col,
            priceModifier: 0,
            image: matchingImg
          };
        });
      } else if (rawMatched.length > 1) {
        variants = rawMatched.map((origFile: string, iIdx: number) => {
          const match = origFile.match(/\(([^()]+)\)/);
          let varName = match ? match[1].replace(/[^a-zA-Z0-9\s-]/g, "").trim() : `Option ${iIdx + 1}`;
          if (varName.toLowerCase() === "specs" || varName.toLowerCase() === "spec") varName = "Overview";
          return {
            name: varName.charAt(0).toUpperCase() + varName.slice(1),
            priceModifier: 0,
            image: slugifiedImages[iIdx]
          };
        });
      }
    }

    for (let vIdx = 0; vIdx < variants.length; vIdx++) {
      const v = variants[vIdx];
      const varCode = getVariantCode(v.name, vIdx);
      const variantSku = `MWB-${catPrefix}-${productNumStr}-V${vIdx + 1}-${varCode}`;

      await prisma.productVariant.create({
        data: {
          productId: productRecord.id,
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

  // B. Insert Catalog 1 items (Hublot, Cartier, AP, Olevs, Lige, Colmi, Khamrah, Asad, Purses, Organizers)
  for (let j = 0; j < cat1Products.length; j++) {
    const item = cat1Products[j];
    const norm = normalize(item.name);
    if (seenNormNames.has(norm)) {
      continue;
    }
    seenNormNames.add(norm);

    let catSlug = item.category.slug;
    if (catSlug === "mens-watches") catSlug = "watches-men";
    else if (catSlug === "ladies-watches") catSlug = "watches-ladies";
    else if (catSlug === "couple-unisex-watch-sets") catSlug = "watches-couple-sets";
    else if (catSlug === "jewellery-accessories") catSlug = "jewellery";
    else if (catSlug === "watch-care-display") catSlug = "accessories-gift-boxes";
    else if (catSlug === "gift-packs-sets") catSlug = "valentines-gift-sets";

    const catId = categoryMap[catSlug] || legacySlugMap[item.category.slug] || categoryMap["watches-men"];
    const catPrefix = categoryPrefixMap[catSlug] || "PRD";

    categoryCounters[catPrefix] = (categoryCounters[catPrefix] || 0) + 1;
    const productNumStr = String(categoryCounters[catPrefix]).padStart(3, "0");
    const productSku = `MWB-${catPrefix}-${productNumStr}`;

    const slugifiedImages = (item.rawImageFiles || []).map((orig: string) => {
      return originalToSlugUrl.get(orig) || `/products/${slugifyImageName(orig)}`;
    });

    const descriptionText = (item.descriptionBullets || []).map((b: string) => `• ${b}`).join("\n");
    const priceVal = item.price !== null ? Number(item.price) : 0;
    const priceMinVal = item.priceMin !== null ? Number(item.priceMin) : null;
    const priceMaxVal = item.priceMax !== null ? Number(item.priceMax) : null;

    const isActive = !item.isPendingReview && slugifiedImages.length > 0;
    const isNew = j < 10;
    const isFeatured = [0, 2, 5, 8, 12, 20, 35, 50].includes(j);
    const isHotDeal = [3, 7, 15, 28, 42, 60].includes(j);
    const parentStock = isActive ? 20 : 0;

    const product = await prisma.product.create({
      data: {
        name: item.name,
        slug: item.slug,
        description: descriptionText,
        price: priceVal,
        priceMin: priceMinVal,
        priceMax: priceMaxVal,
        categoryId: catId,
        images: slugifiedImages,
        stock: parentStock,
        sku: productSku,
        isNew,
        isFeatured,
        isHotDeal,
        isActive,
        statusNote: item.statusNote || (!isActive ? "Awaiting verification" : null)
      }
    });

    if (item.variants && item.variants.length > 0) {
      for (let vIdx = 0; vIdx < item.variants.length; vIdx++) {
        const v = item.variants[vIdx];
        const varCode = getVariantCode(v.name, vIdx);
        const variantSku = `MWB-${catPrefix}-${productNumStr}-V${vIdx + 1}-${varCode}`;
        const priceModifier = v.price ? v.price - priceVal : 0;
        const variantImage = slugifiedImages[vIdx] || slugifiedImages[0] || null;

        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: v.name,
            image: variantImage,
            priceModifier,
            stock: 10,
            sku: variantSku
          }
        });
      }
    } else if (item.colourOptions && item.colourOptions.length > 0) {
      for (let cIdx = 0; cIdx < item.colourOptions.length; cIdx++) {
        const col = item.colourOptions[cIdx];
        const varCode = getVariantCode(col, cIdx);
        const variantSku = `MWB-${catPrefix}-${productNumStr}-V${cIdx + 1}-${varCode}`;
        const variantImage = slugifiedImages[cIdx] || slugifiedImages[0] || null;

        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: `${col} Variant`,
            image: variantImage,
            priceModifier: 0,
            stock: 10,
            sku: variantSku
          }
        });
      }
    }

    totalInserted++;
  }

  // Restore any admin-created products from backup
  await restoreAdminProducts();

  console.log(`\nSuccessfully imported ALL ${totalInserted} unique products into database!`);
  return { totalInserted };
}

if (require.main === module) {
  importAllCatalogs()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
