import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { normaliseOrderRef, phonesMatch, shortOrderRef } from "@/lib/order-tracking";

const findMany = vi.fn();
vi.mock("@/lib/prisma", () => {
  class DatabaseOfflineError extends Error {
    name = "DatabaseOfflineError";
  }
  return {
    prisma: { order: { findMany: (...a: unknown[]) => findMany(...a) } },
    DatabaseOfflineError,
    isDatabaseOfflineError: (e: unknown) => e instanceof Error && e.name === "DatabaseOfflineError",
  };
});

import { POST } from "@/app/api/orders/track/route";
import { DatabaseOfflineError } from "@/lib/prisma";

const ORDER_ID = "cmabc123def456ghk3f9a2qz";

function sampleOrder() {
  return {
    id: ORDER_ID,
    status: "SHIPPED",
    createdAt: new Date("2026-11-20T10:00:00Z"),
    updatedAt: new Date("2026-11-21T09:00:00Z"),
    deliveryMethod: "RIDER",
    county: "Nairobi",
    paymentMethod: "MPESA",
    total: 5200,
    amountDueOnDelivery: 0,
    guestEmail: null,
    shippingAddress: { fullName: "Jane", email: "Jane@Example.com", phoneNumber: "0712 345 678" },
    items: [
      { product: { name: "Asad 100ml", slug: "asad" }, variantName: null, quantity: 1, priceAtPurchase: 2500 },
    ],
  };
}

let ip = 0;
function trackRequest(body: unknown) {
  ip += 1; // fresh IP per request so the rate limiter doesn't interfere
  return new NextRequest("http://localhost:3000/api/orders/track", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${ip}` },
    body: JSON.stringify(body),
  });
}

describe("order tracking helpers", () => {
  it("builds and normalises the short order number", () => {
    expect(shortOrderRef(ORDER_ID)).toBe("K3F9A2QZ");
    expect(normaliseOrderRef(" #K3F9 A2QZ ")).toBe("k3f9a2qz");
  });

  it("matches Kenyan phone numbers across formats", () => {
    expect(phonesMatch("0712345678", "+254 712 345 678")).toBe(true);
    expect(phonesMatch("254712345678", "712345678")).toBe(true);
    expect(phonesMatch("0712345678", "0712345679")).toBe(false);
    expect(phonesMatch("123", "123")).toBe(false);
  });
});

describe("POST /api/orders/track", () => {
  beforeEach(() => findMany.mockReset());

  it("returns the order for the short number + matching phone", async () => {
    findMany.mockResolvedValueOnce([sampleOrder()]);
    const res = await POST(trackRequest({ order: "#K3F9A2QZ", contact: "+254712345678" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.order.reference).toBe("K3F9A2QZ");
    expect(data.order.status).toBe("SHIPPED");
    expect(data.order.items[0]).toMatchObject({ name: "Asad 100ml", quantity: 1, price: 2500 });
    // Personal details are not echoed back
    expect(JSON.stringify(data)).not.toContain("Jane@");
    expect(findMany.mock.calls[0][0].where).toEqual({ id: { endsWith: "k3f9a2qz" } });
  });

  it("finds orders by HG order number", async () => {
    findMany.mockResolvedValueOnce([{ ...sampleOrder(), orderNumber: 10042 }]);
    const res = await POST(trackRequest({ order: "HG-10042", contact: "0712345678" }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.order.reference).toBe("HG-10042");
    expect(findMany.mock.calls[0][0].where).toEqual({ orderNumber: 10042 });
  });

  it("matches by email, case-insensitively", async () => {
    findMany.mockResolvedValueOnce([sampleOrder()]);
    const res = await POST(trackRequest({ order: "k3f9a2qz", contact: "jane@example.com" }));
    expect(res.status).toBe(200);
  });

  it("gives the same not-found answer when the contact doesn't match", async () => {
    findMany.mockResolvedValueOnce([sampleOrder()]);
    const wrong = await POST(trackRequest({ order: "K3F9A2QZ", contact: "0799999999" }));
    findMany.mockResolvedValueOnce([]);
    const missing = await POST(trackRequest({ order: "ZZZZZZZZ", contact: "0712345678" }));

    expect(wrong.status).toBe(404);
    expect(missing.status).toBe(404);
    expect((await wrong.json()).error).toBe((await missing.json()).error);
  });

  it("reports the database being offline", async () => {
    findMany.mockRejectedValueOnce(new DatabaseOfflineError());
    const res = await POST(trackRequest({ order: "K3F9A2QZ", contact: "0712345678" }));
    expect(res.status).toBe(503);
    expect((await res.json()).offline).toBe(true);
  });

  it("rate-limits repeated attempts from one IP", async () => {
    findMany.mockResolvedValue([]);
    const req = () =>
      new NextRequest("http://localhost:3000/api/orders/track", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "10.9.9.9" },
        body: JSON.stringify({ order: "AAAAAAAA", contact: "0712345678" }),
      });
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) statuses.push((await POST(req())).status);
    expect(statuses.slice(0, 10).every((s) => s === 404)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});
