import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackEvent, hasConsent } from "@/lib/meta-pixel";
import { sendCapiEvent } from "@/lib/meta-capi";

describe("Meta Pixel and CAPI Utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_META_PIXEL_ID = "1234567890";
    process.env.META_CAPI_ACCESS_TOKEN = "test_token";
  });

  it("checks default consent correctly", () => {
    expect(hasConsent()).toBe(true);
  });

  it("handles trackEvent safely when fbq is not loaded", () => {
    expect(() => {
      trackEvent("ViewContent", { content_ids: ["test-id"], value: 1000, currency: "KES" });
    }).not.toThrow();
  });

  it("invokes window.fbq when present with eventId deduplication", () => {
    const mockFbq = vi.fn();
    (global as unknown as { window: { fbq: typeof mockFbq } }).window = {
      fbq: mockFbq,
    };

    trackEvent(
      "Purchase",
      { content_ids: ["p1"], value: 2500, currency: "KES" },
      "order_cuid_123"
    );

    expect(mockFbq).toHaveBeenCalledWith(
      "track",
      "Purchase",
      { content_ids: ["p1"], value: 2500, currency: "KES" },
      { eventID: "order_cuid_123" }
    );
  });

  it("sends CAPI event gracefully and formats payload with SHA-256 hashed PII", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events_received: 1 }),
    } as Response);

    const result = await sendCapiEvent({
      eventName: "Purchase",
      eventId: "order_cuid_123",
      userData: {
        email: "customer@example.com",
        phone: "0712345678",
      },
      customData: {
        value: 3500,
        currency: "KES",
        content_ids: ["prod_1"],
      },
    });

    expect(result.success).toBe(true);
    expect(fetchSpy).toHaveBeenCalled();

    const fetchCall = fetchSpy.mock.calls[0];
    expect(fetchCall[0]).toContain("https://graph.facebook.com/v21.0/1234567890/events");

    const requestBody = JSON.parse(fetchCall[1]?.body as string);
    expect(requestBody.data[0].event_name).toBe("Purchase");
    expect(requestBody.data[0].event_id).toBe("order_cuid_123");
    // Verify SHA-256 hashed email of "customer@example.com"
    expect(requestBody.data[0].user_data.em[0]).toBe(
      "e233d4a29013e9d87150c6237c6777bedf379ebf1acdc5d6126fec7e8bb74fb5"
    );
    // Verify SHA-256 hashed phone normalized from 0712345678 -> 254712345678
    expect(requestBody.data[0].user_data.ph[0]).toBe(
      "7132104d6aae9c3fac82095a42c2817952bca48e09d98d5bf4ac08218982fb90"
    );
  });
});
