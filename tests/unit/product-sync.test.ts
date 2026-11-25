import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockPrisma = vi.hoisted(() => ({
  category: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  product: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  productVariant: {
    upsert: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { POST } from "@/app/api/sync/product/route";
import { convertMawimbiToHalisiPrice } from "@/lib/halisi-pricing";

describe("Halisi Price Conversion", () => {
  it("applies exact tiered discounts from Mawimbi prices", () => {
    expect(convertMawimbiToHalisiPrice(1000)).toBe(950);
    expect(convertMawimbiToHalisiPrice(800)).toBe(750);
    expect(convertMawimbiToHalisiPrice(1001)).toBe(851);
    expect(convertMawimbiToHalisiPrice(3000)).toBe(2850);
    expect(convertMawimbiToHalisiPrice(3001)).toBe(2801);
    expect(convertMawimbiToHalisiPrice(5000)).toBe(4800);
    expect(convertMawimbiToHalisiPrice(5001)).toBe(4751);
    expect(convertMawimbiToHalisiPrice(8500)).toBe(8250);
  });
});

describe("Mawimbi to Halisi Product Sync API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SYNC_SECRET_KEY = "test-sync-secret-123";
  });

  it("rejects requests with an invalid or missing sync secret", async () => {
    const req = new NextRequest("https://halisigifts.com/api/sync/product", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-sync-secret": "wrong-secret",
      },
      body: JSON.stringify({ action: "upsert", product: { slug: "test-watch" } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("creates a synced product in KES with auto-created category and variants", async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce(null);
    mockPrisma.category.create.mockResolvedValueOnce({
      id: "cat_1",
      name: "Men's Watches",
      slug: "watches-men",
    });
    mockPrisma.product.findUnique.mockResolvedValue(null);
    mockPrisma.product.create.mockResolvedValueOnce({
      id: "prod_1",
      slug: "casio-edifice-blue",
      price: 8250,
    });
    mockPrisma.productVariant.upsert.mockResolvedValueOnce({});

    const req = new NextRequest("https://halisigifts.com/api/sync/product", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-sync-secret": "test-sync-secret-123",
      },
      body: JSON.stringify({
        action: "upsert",
        product: {
          name: "Casio Edifice Blue",
          slug: "casio-edifice-blue",
          description: "Original chronograph watch",
          price: 8500,
          compareAtPrice: 9500,
          categorySlug: "watches-men",
          categoryName: "Men's Watches",
          images: [],
          stock: 10,
          sku: "MW-WAT-1001",
          isNew: true,
          variants: [
            { name: "Silver Strap", priceModifier: 500, stock: 5, sku: "MW-WAT-1001-SLV" },
          ],
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.product.slug).toBe("casio-edifice-blue");
    expect(data.product.price).toBe(8250);
    expect(mockPrisma.category.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.product.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.productVariant.upsert).toHaveBeenCalledTimes(1);
  });

  it("deletes a synced product when action is delete", async () => {
    mockPrisma.product.deleteMany.mockResolvedValueOnce({ count: 1 });

    const req = new NextRequest("https://halisigifts.com/api/sync/product", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-sync-secret": "test-sync-secret-123",
      },
      body: JSON.stringify({
        action: "delete",
        product: { slug: "casio-edifice-blue" },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.product.deleteMany).toHaveBeenCalledWith({
      where: { slug: "casio-edifice-blue" },
    });
  });
});
