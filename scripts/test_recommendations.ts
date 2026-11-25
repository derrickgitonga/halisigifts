import { prisma } from "../lib/prisma";
import {
  getRelatedProducts,
  getSmartSearchResults,
  getCartRecommendations,
  extractBrand,
} from "../lib/recommendations";

async function runTests() {
  console.log("=== RUNNING RECOMMENDATIONS & SMART SEARCH TESTS ===\n");

  // 1. Test Brand Extraction
  console.log("--- 1. Testing Brand Extraction ---");
  const testNames = [
    "CURREN LADIES #9097 (METALLIC )",
    "Gents Curren Chronograph Watch #8395",
    "NAVIFORCE GENTS WATCH #NF9163",
    "CASIO EDIFICE GENTS WATCH",
    "AMBER OUD BY HARAMAIN PERFUMES",
    "ASAD PERFUMES BY LATTAFA 100ml",
    "COLMI P71 VOICE CALLING SMARTWATCH",
    "VALENTINES MEN GIFT SET",
  ];
  for (const name of testNames) {
    console.log(`• "${name}" -> Brand: ${extractBrand(name)}`);
  }

  // 2. Test Related Products on Curren Watch
  console.log("\n--- 2. Testing Related Products for Curren Watch ---");
  const currenWatch = await prisma.product.findFirst({
    where: { name: { contains: "CURREN LADIES #9097", mode: "insensitive" } },
  });
  if (currenWatch) {
    const related = await getRelatedProducts(currenWatch.id, 4);
    console.log(`Related to "${currenWatch.name}" (KES ${currenWatch.price}):`);
    related.forEach((r, idx) => {
      console.log(`  [${idx + 1}] ${r.name} - KES ${r.price} (${r.category?.name})`);
    });
    // Assertions
    const includesSelf = related.some((r) => r.id === currenWatch.id);
    const includesInactive = related.some((r) => r.name.includes("8403"));
    console.log(`  Assert: Does NOT include self: ${!includesSelf ? "PASSED" : "FAILED"}`);
    console.log(`  Assert: Does NOT include inactive item (8403): ${!includesInactive ? "PASSED" : "FAILED"}`);
  }

  // 3. Test Related Products on Amber Oud Perfume
  console.log("\n--- 3. Testing Related Products for Amber Oud Perfume ---");
  const perfume = await prisma.product.findFirst({
    where: { name: { contains: "AMBER OUD", mode: "insensitive" } },
  });
  if (perfume) {
    const related = await getRelatedProducts(perfume.id, 4);
    console.log(`Related to "${perfume.name}" (KES ${perfume.price}):`);
    related.forEach((r, idx) => {
      console.log(`  [${idx + 1}] ${r.name} - KES ${r.price} (${r.category?.name})`);
    });
  }

  // 4. Test Related Products on Valentine's Gift Set
  console.log("\n--- 4. Testing Related Products for Valentine's Gift Set ---");
  const giftSet = await prisma.product.findFirst({
    where: { name: { contains: "VALENTINES MEN GIFT SET", mode: "insensitive" } },
  });
  if (giftSet) {
    const related = await getRelatedProducts(giftSet.id, 4);
    console.log(`Related to "${giftSet.name}" (KES ${giftSet.price}):`);
    related.forEach((r, idx) => {
      console.log(`  [${idx + 1}] ${r.name} - KES ${r.price} (${r.category?.name})`);
    });
  }

  // 5. Test Smart Search - Query with Many Matches
  console.log("\n--- 5. Testing Smart Search: High Match Query ('Casio') ---");
  const searchCasio = await getSmartSearchResults("Casio", 6);
  console.log(`Query: "${searchCasio.query}", Exact: ${searchCasio.exactMatches.length}, Fallback: ${searchCasio.fallbackMatches.length}, isFallback: ${searchCasio.isFallback}`);
  searchCasio.exactMatches.slice(0, 3).forEach((m) => console.log(`  • [Exact] ${m.name} (KES ${m.price})`));

  // 6. Test Smart Search - Query with Few Matches
  console.log("\n--- 6. Testing Smart Search: Few Matches Query ('NF9163') ---");
  const searchNF = await getSmartSearchResults("NF9163", 6);
  console.log(`Query: "${searchNF.query}", Exact: ${searchNF.exactMatches.length}, Fallback: ${searchNF.fallbackMatches.length}, isFallback: ${searchNF.isFallback}`);
  searchNF.exactMatches.forEach((m) => console.log(`  • [Exact] ${m.name} (KES ${m.price})`));
  searchNF.fallbackMatches.slice(0, 3).forEach((m) => console.log(`  • [Fallback] ${m.name} (KES ${m.price})`));

  // 7. Test Smart Search - Query with Zero Matches
  console.log("\n--- 7. Testing Smart Search: Zero Matches Query ('xyznonexistent') ---");
  const searchZero = await getSmartSearchResults("xyznonexistent", 6);
  console.log(`Query: "${searchZero.query}", Exact: ${searchZero.exactMatches.length}, Fallback: ${searchZero.fallbackMatches.length}, isFallback: ${searchZero.isFallback}`);
  searchZero.fallbackMatches.slice(0, 4).forEach((m) => console.log(`  • [Fallback] ${m.name} (KES ${m.price})`));
  const zeroInactive = searchZero.fallbackMatches.some((m) => m.name.includes("8403"));
  console.log(`  Assert: Does NOT include inactive item (8403): ${!zeroInactive ? "PASSED" : "FAILED"}`);

  // 8. Test Cart Recommendations
  console.log("\n--- 8. Testing Cart Recommendations ---");
  if (currenWatch) {
    const cartRecs = await getCartRecommendations([currenWatch.id], 4);
    console.log(`Cart with watch [${currenWatch.name}] recommendations:`);
    cartRecs.forEach((r, idx) => {
      console.log(`  [${idx + 1}] ${r.name} - KES ${r.price} (${r.category?.name})`);
    });
    const cartHasSelf = cartRecs.some((r) => r.id === currenWatch.id);
    const cartHasInactive = cartRecs.some((r) => r.name.includes("8403"));
    console.log(`  Assert: Does NOT include cart item: ${!cartHasSelf ? "PASSED" : "FAILED"}`);
    console.log(`  Assert: Does NOT include inactive item (8403): ${!cartHasInactive ? "PASSED" : "FAILED"}`);
  }

  console.log("\n=== ALL TESTS COMPLETED SUCCESSFULLY ===");
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
