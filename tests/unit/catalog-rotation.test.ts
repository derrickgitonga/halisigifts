import { describe, it, expect } from "vitest";
import { rotateCatalogForWindow, type ShopProduct } from "@/lib/home-catalog";

function makeProducts(count: number): ShopProduct[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `prod_${String(i).padStart(3, "0")}`,
    name: `Product ${i}`,
    slug: `product-${i}`,
    price: 1000 + i * 100,
    compareAtPrice: null,
    image: `/products/p${i}.jpg`,
    categoryId: "cat_1",
    inStock: true,
    stock: 10,
    brand: "Casio",
    hasVariants: false,
    isNew: false,
    createdAt: new Date(2026, 0, 1 + (i % 28)).toISOString(),
  }));
}

describe("Homepage 3-hour product rotation", () => {
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

  it("returns the same deterministic order within the same 3-hour window", () => {
    const products = makeProducts(36);
    const t1 = 1_700_000_000_000;
    const windowStart = Math.floor(t1 / THREE_HOURS_MS) * THREE_HOURS_MS;

    const a = rotateCatalogForWindow(products, windowStart + 1000);
    const b = rotateCatalogForWindow(products, windowStart + THREE_HOURS_MS - 1000);

    expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id));
  });

  it("rotates to a completely fresh set of 12 products every 3 hours and covers 100% of products", () => {
    const products = makeProducts(50);
    const totalPages = Math.ceil(products.length / 12);
    const baseTime = 0;

    const firstWindowTop12 = new Set(
      rotateCatalogForWindow(products, baseTime).slice(0, 12).map((p) => p.id)
    );
    const secondWindowTop12 = new Set(
      rotateCatalogForWindow(products, baseTime + THREE_HOURS_MS).slice(0, 12).map((p) => p.id)
    );

    // No overlap between consecutive 12-item windows
    for (const id of firstWindowTop12) {
      expect(secondWindowTop12.has(id)).toBe(false);
    }

    // Every single product appears in the homepage top 12 across one full cycle
    const seen = new Set<string>();
    for (let slot = 0; slot < totalPages; slot++) {
      const top12 = rotateCatalogForWindow(products, baseTime + slot * THREE_HOURS_MS).slice(0, 12);
      for (const p of top12) seen.add(p.id);
    }
    expect(seen.size).toBe(products.length);
  });
});
