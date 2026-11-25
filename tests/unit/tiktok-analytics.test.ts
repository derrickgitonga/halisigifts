import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackTikTokEvent, trackTikTokPageView, identifyTikTokUser, hasConsent } from "@/lib/tiktok-pixel";
import { sendTikTokEvent } from "@/lib/tiktok-events-api";

const mockProducts = [
  {
    id: "prod_1",
    name: "Luxury Watch",
    slug: "luxury-watch",
    price: 5000,
    compareAtPrice: 6000,
    description: "Fine luxury watch",
    stock: 10,
    isNew: true,
    isHotDeal: false,
    isFeatured: true,
    images: ["/watch.jpg"],
    category: { name: "Watches", slug: "watches" },
    variants: [],
  },
];

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

describe("TikTok Pixel and Events API Utilities", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never);
    process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID = "TT_PIXEL_123456";
    process.env.TIKTOK_EVENTS_API_ACCESS_TOKEN = "test_tt_token";
  });

  it("checks default consent correctly", () => {
    expect(hasConsent()).toBe(true);
  });

  it("handles trackTikTokEvent safely when ttq is not loaded", () => {
    expect(() => {
      trackTikTokEvent("ViewContent", { content_id: "test-id", value: 1000, currency: "KES" });
      trackTikTokPageView();
      identifyTikTokUser({ email: "test@example.com", phone: "0712345678" });
    }).not.toThrow();
  });

  it("invokes window.ttq.track when present with event_id deduplication", () => {
    const mockTrack = vi.fn();
    (global as unknown as { window: { ttq: { track: typeof mockTrack } } }).window = {
      ttq: {
        track: mockTrack,
      },
    };

    trackTikTokEvent(
      "PlaceAnOrder",
      { value: 2500, currency: "KES" },
      "order_cuid_456"
    );

    expect(mockTrack).toHaveBeenCalledWith(
      "PlaceAnOrder",
      { value: 2500, currency: "KES" },
      { event_id: "order_cuid_456" }
    );
  });

  it("sends TikTok Events API event gracefully with SHA-256 hashed user data", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0, message: "OK" }),
    } as Response);

    const result = await sendTikTokEvent({
      eventName: "PlaceAnOrder",
      eventId: "order_cuid_456",
      userData: {
        email: "customer@example.com",
        phone: "0712345678",
        clientIp: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      },
      properties: {
        value: 3500,
        currency: "KES",
        order_id: "order_cuid_456",
      },
    });

    expect(result.success).toBe(true);
    expect(fetchSpy).toHaveBeenCalled();

    const fetchCall = fetchSpy.mock.calls[0];
    expect(fetchCall[0]).toBe("https://business-api.tiktok.com/open_api/v1.3/event/track/");

    const headers = fetchCall[1]?.headers as Record<string, string>;
    expect(headers["Access-Token"]).toBe("test_tt_token");

    const requestBody = JSON.parse(fetchCall[1]?.body as string);
    expect(requestBody.event_source_id).toBe("TT_PIXEL_123456");
    expect(requestBody.data[0].event).toBe("PlaceAnOrder");
    expect(requestBody.data[0].event_id).toBe("order_cuid_456");
    // Verify SHA-256 hashed email
    expect(requestBody.data[0].user.phone).toBe(
      "7132104d6aae9c3fac82095a42c2817952bca48e09d98d5bf4ac08218982fb90"
    );
  });

  it("generates valid TikTok Catalog Feed in CSV format", async () => {
    const { GET } = await import("@/app/api/tiktok-feed/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost:3000/api/tiktok-feed?format=csv");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    const text = await res.text();
    const lines = text.split("\n");
    expect(lines[0]).toContain("sku_id,item_group_id,title,description,availability,condition,price,sale_price,link,image_link");
    expect(lines.length).toBeGreaterThan(1);
  });

  it("generates valid TikTok Catalog Feed in XML format", async () => {
    const { GET } = await import("@/app/api/tiktok-feed/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost:3000/api/tiktok-feed?format=xml");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/xml");
    const xml = await res.text();
    expect(xml).toContain("<channel>");
    expect(xml).toContain("<sku_id>");
    expect(xml).toContain("<item_group_id>");
  });
});
