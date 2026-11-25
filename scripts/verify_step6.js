const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runStep6Verification() {
  console.log('=====================================================================');
  console.log('STEP 6 VERIFICATION REPORT');
  console.log('=====================================================================');

  // 1. Count products per category
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  const totalProducts = await prisma.product.count();
  const activeProducts = await prisma.product.count({ where: { isActive: true } });
  const inactiveProducts = await prisma.product.count({ where: { isActive: false } });
  const totalVariants = await prisma.productVariant.count();

  console.log('\n--- 1. DATABASE COUNTS PER CATEGORY ---');
  categories.forEach(cat => {
    console.log(`- ${cat.name.padEnd(30)}: ${cat._count.products} products (slug: ${cat.slug})`);
  });
  console.log(`\nTotal Products in DB: ${totalProducts}`);
  console.log(`Active Products: ${activeProducts}`);
  console.log(`Inactive Products (Pending Review): ${inactiveProducts}`);
  console.log(`Total Product Variants: ${totalVariants}`);

  // 2. Spot check specific products
  const spotCheckSlugs = [
    'ochstin-chronograph-gents-watch-6132',
    'wooden-executive-watch-organizers',
    '7-in-1-men-quality-gift-pack',
    'seiko-5-couple-watches',
    'executive-aaa-quality-watches',
    'golden-hour-gents-watch'
  ];

  console.log('\n--- 2. SPOT CHECK OF STORED PRODUCTS ---');
  for (const slug of spotCheckSlugs) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: true
      }
    });

    if (product) {
      console.log('\n------------------------------------------------------------');
      console.log(`Product Name: ${product.name}`);
      console.log(`SKU:          ${product.sku}`);
      console.log(`Slug:         ${product.slug}`);
      console.log(`Category:     ${product.category.name}`);
      console.log(`Base Price:   KES ${Number(product.price).toLocaleString()}`);
      if (product.priceMin !== null || product.priceMax !== null) {
        console.log(`Price Range:  KES ${Number(product.priceMin).toLocaleString()} - KES ${Number(product.priceMax).toLocaleString()}`);
      }
      console.log(`Active State: ${product.isActive ? 'Active (Live)' : 'Inactive (Hidden from Storefront)'}`);
      if (product.statusNote) console.log(`Status Note:  ${product.statusNote}`);
      console.log(`Image Count:  ${product.images.length}`);
      console.log(`Images:       ${product.images.join(', ')}`);
      console.log(`Variants (${product.variants.length}):`);
      product.variants.forEach(v => {
        const finalPrice = Number(product.price) + Number(v.priceModifier);
        console.log(`  - ${v.name.padEnd(25)} [SKU: ${v.sku.padEnd(22)}] [Price: KES ${finalPrice.toLocaleString()}]`);
      });
      console.log(`Description:`);
      product.description.split('\n').slice(0, 5).forEach(line => console.log(`  ${line}`));
    } else {
      console.log(`Product with slug ${slug} not found!`);
    }
  }

  console.log('\n=====================================================================');
}

runStep6Verification()
  .catch(err => {
    console.error('Verification error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
