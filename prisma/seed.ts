import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { importAllCatalogs } from "../scripts/import_all_catalogs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Halisi Gifts database...");

  // 1. Safe credential handling from environment variables
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordPlain = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPasswordPlain) {
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    const adminPasswordHash = await bcrypt.hash(adminPasswordPlain, 10);
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Halisi Administrator",
          passwordHash: adminPasswordHash,
          role: "ADMIN",
        }
      });
      console.log("Created initial Admin user.");
    } else {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { name: "Halisi Administrator", passwordHash: adminPasswordHash, role: "ADMIN" }
      });
      console.log("Admin user exists - synchronized password.");
    }
  }

  const customerEmail = process.env.CUSTOMER_EMAIL;
  const customerPasswordPlain = process.env.SEED_CUSTOMER_PASSWORD || process.env.CUSTOMER_PASSWORD;

  if (customerEmail && customerPasswordPlain) {
    const existingCustomer = await prisma.user.findUnique({ where: { email: customerEmail } });
    const customerPasswordHash = await bcrypt.hash(customerPasswordPlain, 10);
    if (!existingCustomer) {
      await prisma.user.create({
        data: {
          email: customerEmail,
          name: "Customer Account",
          passwordHash: customerPasswordHash,
          role: "CUSTOMER",
        }
      });
      console.log("Created initial Customer user.");
    } else {
      await prisma.user.update({
        where: { email: customerEmail },
        data: { name: "Customer Account", passwordHash: customerPasswordHash, role: "CUSTOMER" }
      });
      console.log("Customer user exists - synchronized password.");
    }
  }

  // 2. Import complete unified catalog (186 products)
  const result = await importAllCatalogs();
  console.log(`Database seeded successfully: ${result.totalInserted} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
