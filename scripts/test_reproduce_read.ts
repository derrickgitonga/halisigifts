import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

async function main() {
  const tokenPath = path.join(process.cwd(), "temp_persistence_token.txt");
  if (!fs.existsSync(tokenPath)) {
    console.error("[READ PROCESS ERROR] Expected token file temp_persistence_token.txt does not exist.");
    process.exit(1);
  }

  const expectedToken = fs.readFileSync(tokenPath, "utf8").trim();

  console.log(`[READ PROCESS - PID ${process.pid}] Starting read in a fresh, isolated process...`);
  console.log(`[READ PROCESS] Expected Token to read: "${expectedToken}"`);

  const product = await prisma.product.findUnique({
    where: { slug: "elegant-gift-cards" },
    select: { id: true, name: true, slug: true, description: true, updatedAt: true },
  });

  if (!product) {
    console.error("[READ PROCESS ERROR] Product not found in database.");
    process.exit(1);
  }

  console.log(`[READ PROCESS] Fetched product from database:`);
  console.log(` - ID: ${product.id}`);
  console.log(` - Name: ${product.name}`);
  console.log(` - Read Description: "${product.description}"`);
  console.log(` - DB UpdatedAt: ${product.updatedAt.toISOString()}`);

  const isExactMatch = product.description === expectedToken;
  console.log(`[READ PROCESS RESULT] Token Exact Match: ${isExactMatch ? "MATCHED (100% PERSISTENCE VERIFIED)" : "FAILED (MISMATCH)"}`);

  if (!isExactMatch) {
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error("[READ PROCESS ERROR]", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
