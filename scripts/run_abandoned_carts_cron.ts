import { processAbandonedCarts } from "../lib/cron/abandoned-carts";
import { prisma } from "../lib/prisma";

async function main() {
  console.log(`[${new Date().toISOString()}] Starting abandoned carts recovery cron runner...`);
  try {
    const result = await processAbandonedCarts();
    console.log(`[${new Date().toISOString()}] Cron run complete:`);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cron runner encountered error:`, error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
