import { prisma } from "../lib/prisma";
import crypto from "crypto";
import fs from "fs";
import path from "path";

async function main() {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const token = `ISOLATED_PROCESS_WRITE_TEST_${uuid}_TIMESTAMP_${timestamp}`;

  const tokenPath = path.join(process.cwd(), "temp_persistence_token.txt");
  fs.writeFileSync(tokenPath, token, "utf8");

  console.log(`[WRITE PROCESS - PID ${process.pid}] Starting write...`);
  console.log(`[WRITE PROCESS] Target Product: "elegant-gift-cards"`);
  console.log(`[WRITE PROCESS] Generated Token: "${token}"`);

  const updated = await prisma.product.update({
    where: { slug: "elegant-gift-cards" },
    data: { description: token },
    select: { id: true, name: true, slug: true, description: true, updatedAt: true },
  });

  console.log(`[WRITE PROCESS] prisma.product.update completed:`);
  console.log(` - ID: ${updated.id}`);
  console.log(` - Updated Description: "${updated.description}"`);
  console.log(` - DB UpdatedAt: ${updated.updatedAt.toISOString()}`);
  console.log(`[WRITE PROCESS] Disconnecting PrismaClient and terminating process.`);
}

main()
  .catch((err) => {
    console.error("[WRITE PROCESS ERROR]", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
