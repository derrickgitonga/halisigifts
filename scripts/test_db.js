const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    console.log('Connected to DB!');
    console.log('Users:', userCount, 'Products:', productCount, 'Categories:', categoryCount);
  } catch (err) {
    console.log('DB error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
