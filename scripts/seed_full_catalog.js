const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const parsedProducts = JSON.parse(fs.readFileSync('temp_docx/parsed_products_full.json', 'utf8'));
const imageAuditMap = JSON.parse(fs.readFileSync('temp_docx/image_slug_audit_map.json', 'utf8'));

// Build quick lookup for slugified image URLs from original filenames
const originalToUrlMap = new Map();
imageAuditMap.forEach(item => {
  originalToUrlMap.set(item.originalFile, item.url);
});

// 9 Taxonomy Categories
const categoriesData = [
  {
    name: "Men's Watches",
    slug: "mens-watches",
    description: "Premium analogue, chronograph, automatic and quartz timepieces for gentlemen.",
    image: "/products/hublot-automatic-gents-watch-blue.jpg"
  },
  {
    name: "Ladies' Watches",
    slug: "ladies-watches",
    description: "Elegant, sophisticated, iced and minimalist watches tailored for ladies.",
    image: "/products/cartier-ladies-gold.jpg"
  },
  {
    name: "Couple / Unisex Watch Sets",
    slug: "couple-unisex-watch-sets",
    description: "Matching pairs and sets for couples celebrating love and shared moments.",
    image: "/products/seiko-5-couple-watches-gold.jpg"
  },
  {
    name: "Smart Watches",
    slug: "smart-watches",
    description: "Next-generation smartwatches with health tracking, calling, and multi-sport features.",
    image: "/products/colmi-p71-voice-calling-smartwatch.jpg"
  },
  {
    name: "Jewellery & Accessories",
    slug: "jewellery-accessories",
    description: "Exquisite necklaces, bracelets, pearl sets, and engravable pieces.",
    image: "/products/i-love-you-necklace.jpg"
  },
  {
    name: "Perfumes & Fragrances",
    slug: "perfumes-fragrances",
    description: "Authentic luxury Arabian fragrances, oud moods, and gift perfume sets.",
    image: "/products/asad-perfumes-by-lattafa-100ml-black.jpg"
  },
  {
    name: "Gift Packs & Sets",
    slug: "gift-packs-sets",
    description: "Curated gift bundles featuring watches, wallets, perfumes, belts, and accessories.",
    image: "/products/7-in-1-men-quality-gift-pack.jpg"
  },
  {
    name: "Bags & Purses",
    slug: "bags-purses",
    description: "High-quality leather purses, wallets, and functional fashion bags.",
    image: "/products/very-high-quality-ladies-purse-black.jpg"
  },
  {
    name: "Watch Care & Display",
    slug: "watch-care-display",
    description: "Wooden watch organizers, presentation stands, gift boxes, and brand labels.",
    image: "/products/wooden-executive-watch-organizers-10-slots.jpg"
  }
];

const categoryPrefixMap = {
  'mens-watches': 'MEN',
  'ladies-watches': 'LAD',
  'couple-unisex-watch-sets': 'CPL',
  'smart-watches': 'SMT',
  'jewellery-accessories': 'JWL',
  'perfumes-fragrances': 'PRF',
  'gift-packs-sets': 'GFT',
  'bags-purses': 'BAG',
  'watch-care-display': 'WCD',
};

async function seedFullCatalog() {
  console.log("Seeding Halisi Gifts entire catalog...");

  // 1. Seed Categories
  const categoryMap = {};
  for (const cat of categoriesData) {
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
  console.log(`Seeded ${Object.keys(categoryMap).length} categories.`);

  // 2. Clear existing products to ensure clean, consistent state
  console.log("Cleaning existing products for fresh seed...");
  await prisma.productVariant.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.product.deleteMany({});

  // 3. Seed all 113 products
  let insertedCount = 0;
  const categoryCounters = {};

  for (let i = 0; i < parsedProducts.length; i++) {
    const item = parsedProducts[i];
    const catSlug = item.category.slug;
    const catId = categoryMap[catSlug];
    const catPrefix = categoryPrefixMap[catSlug] || 'PRD';

    categoryCounters[catPrefix] = (categoryCounters[catPrefix] || 0) + 1;
    const productNumStr = String(categoryCounters[catPrefix]).padStart(3, '0');
    const productSku = `MWB-${catPrefix}-${productNumStr}`;

    // Map images to slugified URLs
    const slugifiedImages = item.rawImageFiles.map(orig => {
      const url = originalToUrlMap.get(orig);
      if (!url) {
        console.warn(`Warning: image url not found for ${orig}`);
        return `/products/${encodeURIComponent(orig)}`;
      }
      return url;
    });

    const descriptionText = item.descriptionBullets.map(b => `• ${b}`).join('\n');
    const priceVal = item.price !== null ? Number(item.price) : 0;
    const priceMinVal = item.priceMin !== null ? Number(item.priceMin) : null;
    const priceMaxVal = item.priceMax !== null ? Number(item.priceMax) : null;

    // Is active: false for pending items like Golden Hour Gents Watch
    const isActive = !item.isPendingReview;
    const isNew = i < 15;
    const isFeatured = [0, 1, 6, 7, 17, 30, 46, 66, 84].includes(i);
    const isHotDeal = [4, 9, 21, 32, 49, 76, 91].includes(i);

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
        stock: isActive ? 20 : 0,
        sku: productSku,
        isNew,
        isFeatured,
        isHotDeal,
        isActive,
        statusNote: item.statusNote || null
      }
    });

    // 4. Create variants
    if (item.variants && item.variants.length > 0) {
      for (let vIdx = 0; vIdx < item.variants.length; vIdx++) {
        const v = item.variants[vIdx];
        let varCode = `V${vIdx + 1}`;
        if (v.name.toLowerCase().includes('leather')) varCode = 'LEA';
        else if (v.name.toLowerCase().includes('metallic')) varCode = 'MET';
        else if (v.name.toLowerCase().includes('converse')) varCode = 'CNV';
        else if (v.name.toLowerCase().includes('couple')) varCode = 'CPL';
        else if (v.name.toLowerCase().includes('single')) varCode = 'SNG';
        else if (v.name.toLowerCase().includes('6 slots')) varCode = '06S';
        else if (v.name.toLowerCase().includes('10 slots')) varCode = '10S';
        else if (v.name.toLowerCase().includes('12 slots')) varCode = '12S';
        else if (v.name.toLowerCase().includes('plain')) varCode = 'PLN';
        else if (v.name.toLowerCase().includes('brand label') || v.name.toLowerCase().includes('sticker')) varCode = 'STK';

        const variantSku = `MWB-${catPrefix}-${productNumStr}-${varCode}`;
        const priceModifier = v.price ? v.price - priceVal : 0;

        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: v.name,
            priceModifier,
            stock: 10,
            sku: variantSku
          }
        });
      }
    } else if (item.colourOptions && item.colourOptions.length > 0) {
      for (let cIdx = 0; cIdx < item.colourOptions.length; cIdx++) {
        const col = item.colourOptions[cIdx];
        const colCode = col.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
        const variantSku = `MWB-${catPrefix}-${productNumStr}-C${cIdx + 1}-${colCode || 'VAR'}`;

        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: `${col} Variant`,
            priceModifier: 0,
            stock: 10,
            sku: variantSku
          }
        });
      }
    }

    insertedCount++;
  }

  console.log(`Successfully seeded all ${insertedCount} products into database!`);
}

seedFullCatalog()
  .catch(err => {
    console.error("Error during full seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
