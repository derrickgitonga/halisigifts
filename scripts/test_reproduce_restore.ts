import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

async function main() {
  const originalDescription =
    "Premium customized luxury gift cards with gold foil accents and envelopes. Perfect for birthdays, anniversaries, weddings, and corporate recognition.";

  console.log(`[RESTORE PROCESS - PID ${process.pid}] Restoring original product description...`);

  const updated = await prisma.product.update({
    where: { slug: "elegant-gift-cards" },
    data: { description: originalDescription },
    select: { id: true, name: true, slug: true, description: true, updatedAt: true },
  });

  console.log(`[RESTORE PROCESS] Restored successfully:`);
  console.log(` - ID: ${updated.id}`);
  console.log(` - Description: "${updated.description}"`);
  console.log(` - UpdatedAt: ${updated.updatedAt.toISOString()}`);

  const tokenPath = path.join(process.cwd(), "temp_persistence_token.txt");
  if (fs.existsSync(tokenPath)) {
    fs.unlinkSync(tokenPath);
    console.log(`[RESTORE PROCESS] Cleaned temp_persistence_token.txt.`);
  }
}

main()
  .catch((err) => {
    console.error("[RESTORE PROCESS ERROR]", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
