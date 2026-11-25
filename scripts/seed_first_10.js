const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const parsedProducts = JSON.parse(fs.readFileSync('temp_docx/parsed_products_full.json', 'utf8'));

// 9 Taxonomy Categories
const categoriesData = [
  {
    name: "Men's Watches",
    slug: "mens-watches",
    description: "Premium analogue, chronograph, automatic and quartz timepieces for gentlemen.",
    image: "/PRODUCTS/HUBLOT%20AUTOMATIC%20GENTS%20WATCH(blue).jpg"
  },
  {
    name: "Ladies' Watches",
    slug: "ladies-watches",
    description: "Elegant, sophisticated, iced and minimalist watches tailored for ladies.",
    image: "/PRODUCTS/CARTIER%20LADIES(gold).jpg"
  },
  {
    name: "Couple / Unisex Watch Sets",
    slug: "couple-unisex-watch-sets",
    description: "Matching pairs and sets for couples celebrating love and shared moments.",
    image: "/PRODUCTS/SEIKO%205%20COUPLE%20WATCHES(gold).jpg"
  },
  {
    name: "Smart Watches",
    slug: "smart-watches",
    description: "Next-generation smartwatches with health tracking, calling, and multi-sport features.",
    image: "/PRODUCTS/COLMi%20P71%20-%20Voice%20Calling%20Smartwatch.jpg"
  },
  {
    name: "Jewellery & Accessories",
    slug: "jewellery-accessories",
    description: "Exquisite necklaces, bracelets, pearl sets, and engravable pieces.",
    image: "/PRODUCTS/I%20LOVE%20YOU%20NECKLACE.jpg"
  },
  {
    name: "Perfumes & Fragrances",
    slug: "perfumes-fragrances",
    description: "Authentic luxury Arabian fragrances, oud moods, and gift perfume sets.",
    image: "/PRODUCTS/ASAD%20PERFUMES%20BY%20LATTAFA%20100ml(black).jpg"
  },
  {
    name: "Gift Packs & Sets",
    slug: "gift-packs-sets",
    description: "Curated gift bundles featuring watches, wallets, perfumes, belts, and accessories.",
    image: "/PRODUCTS/7%20IN%201%20MEN%20QUALITY%20GIFT%20PACK.jpg"
  },
  {
    name: "Bags & Purses",
    slug: "bags-purses",
    description: "High-quality leather purses, wallets, and functional fashion bags.",
    image: "/PRODUCTS/VERY%20HIGH%20QUALITY%20LADIES%20PURSE(black).jpg"
  },
  {
    name: "Watch Care & Display",
    slug: "watch-care-display",
    description: "Wooden watch organizers, presentation stands, gift boxes, and brand labels.",
    image: "/PRODUCTS/WOODEN%20EXECUTIVE%20WATCH%20ORGANIZERS(10%20slots).jpg"
  }
];

async function seedFirstBatch() {
  console.log("Seeding categories...");
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
  console.log("Categories seeded successfully:", Object.keys(categoryMap).length);

  // Take first 10 products
  const first10 = parsedProducts.slice(0, 10);
  console.log(`Inserting first ${first10.length} products...`);

  const insertedRecords = [];

  for (const item of first10) {
    const categoryId = categoryMap[item.category.slug];
    const descriptionText = item.descriptionBullets.join('\n• ');
    const formattedDesc = item.descriptionBullets.length > 0 ? `• ${descriptionText}` : '';

    const priceVal = item.price !== null ? Number(item.price) : 0;
    const priceMinVal = item.priceMin !== null ? Number(item.priceMin) : null;
    const priceMaxVal = item.priceMax !== null ? Number(item.priceMax) : null;

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: formattedDesc,
        price: priceVal,
        priceMin: priceMinVal,
        priceMax: priceMaxVal,
        categoryId: categoryId,
        images: item.images,
        stock: 15,
        sku: item.sku,
        statusNote: item.statusNote || null,
        isFeatured: item.index <= 5,
        isNew: true,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: formattedDesc,
        price: priceVal,
        priceMin: priceMinVal,
        priceMax: priceMaxVal,
        categoryId: categoryId,
        images: item.images,
        stock: 15,
        sku: item.sku,
        statusNote: item.statusNote || null,
        isFeatured: item.index <= 5,
        isNew: true,
      }
    });

    // Create variants if defined
    if (item.variants && item.variants.length > 0) {
      await prisma.productVariant.deleteMany({
        where: { productId: product.id }
      });

      for (let vIdx = 0; vIdx < item.variants.length; vIdx++) {
        const v = item.variants[vIdx];
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: v.name,
            priceModifier: v.price ? v.price - priceVal : 0,
            stock: 10,
            sku: `${product.sku}-V${vIdx + 1}`
          }
        });
      }
    } else if (item.colourOptions && item.colourOptions.length > 0) {
      await prisma.productVariant.deleteMany({
        where: { productId: product.id }
      });

      for (let cIdx = 0; cIdx < item.colourOptions.length; cIdx++) {
        const col = item.colourOptions[cIdx];
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: `${col} Variant`,
            priceModifier: 0,
            stock: 10,
            sku: `${product.sku}-C${cIdx + 1}`
          }
        });
      }
    }

    // Fetch full record with category and variants
    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        variants: true
      }
    });

    insertedRecords.push(fullProduct);
  }

  console.log("Finished inserting first 10 products.");
  fs.writeFileSync('temp_docx/first_10_inserted.json', JSON.stringify(insertedRecords, null, 2));
}

seedFirstBatch()
  .catch(err => {
    console.error("Error seeding first batch:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
