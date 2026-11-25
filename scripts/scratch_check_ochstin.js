const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOchstin() {
  const p = await prisma.product.findFirst({
    where: { name: { contains: 'Ochstin', mode: 'insensitive' } },
    include: { variants: true, category: true }
  });
  console.log(JSON.stringify(p, null, 2));
  await prisma.$disconnect();
}
checkOchstin();
