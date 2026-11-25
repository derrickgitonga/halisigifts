const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const digitalKeywords = ['dual time', 'worldtime', 'world time', 'azan', 'digital', 'illuminator', 'led', 'world-time'];

async function testQueries() {
  const allCategories = [
    'analogue-watches',
    'digital-watches',
    'smart-watches',
    'gifts-accessories',
    'mens-watches',
    'ladies-watches',
    'couple-unisex-watch-sets',
    'perfumes-fragrances',
    'gift-packs-sets',
    'jewellery-accessories',
    'bags-purses',
    'watch-care-display'
  ];

  console.log('Testing category resolution:');

  for (const slug of allCategories) {
    let whereClause = { isActive: true };

    if (slug === 'analogue-watches') {
      whereClause = {
        isActive: true,
        category: {
          slug: { in: ['mens-watches', 'ladies-watches', 'couple-unisex-watch-sets', 'analogue-watches'] }
        },
        NOT: {
          OR: digitalKeywords.map(kw => ({
            name: { contains: kw, mode: 'insensitive' }
          }))
        }
      };
    } else if (slug === 'digital-watches') {
      whereClause = {
        isActive: true,
        OR: [
          { category: { slug: 'digital-watches' } },
          ...digitalKeywords.map(kw => ({
            name: { contains: kw, mode: 'insensitive' }
          })),
          ...digitalKeywords.map(kw => ({
            description: { contains: kw, mode: 'insensitive' }
          }))
        ],
        NOT: {
          category: { slug: 'smart-watches' }
        }
      };
    } else if (slug === 'gifts-accessories') {
      whereClause = {
        isActive: true,
        category: {
          slug: {
            in: [
              'gifts-accessories',
              'gift-packs-sets',
              'perfumes-fragrances',
              'jewellery-accessories',
              'bags-purses',
              'watch-care-display'
            ]
          }
        }
      };
    } else if (slug === 'smart-watches') {
      whereClause = {
        isActive: true,
        category: { slug: 'smart-watches' }
      };
    } else {
      whereClause = {
        isActive: true,
        category: { slug }
      };
    }

    const count = await prisma.product.count({ where: whereClause });
    console.log(`- ${slug.padEnd(26)} : ${count} products available`);
  }
}

testQueries().finally(() => prisma.$disconnect());
