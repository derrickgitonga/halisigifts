/**
 * Creates (or updates the password of) the admin and test customer accounts
 * from .env, without touching products.
 *
 *   npx tsx --env-file=.env scripts/seed_users.ts
 *
 * Uses ADMIN_EMAIL + SEED_ADMIN_PASSWORD and CUSTOMER_EMAIL + SEED_CUSTOMER_PASSWORD.
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(email: string | undefined, password: string | undefined, name: string, role: Role) {
  if (!email || !password) {
    console.log(`Skipped ${role}: email or password not set in .env`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role },
    create: { email, name, passwordHash, role },
  });
  console.log(`${role} account ready: ${email}`);
}

async function main() {
  await upsertUser(
    process.env.ADMIN_EMAIL,
    process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD,
    "Halisi Administrator",
    "ADMIN"
  );
  await upsertUser(
    process.env.CUSTOMER_EMAIL,
    process.env.SEED_CUSTOMER_PASSWORD || process.env.CUSTOMER_PASSWORD,
    "Customer Account",
    "CUSTOMER"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
