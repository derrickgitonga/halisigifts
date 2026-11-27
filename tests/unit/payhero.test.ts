import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  normalizePayHeroPhone,
  getPayHeroAuthHeader,
  parsePayHeroCallback,
} from "@/lib/payhero";

describe("PayHero v2 utilities", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.PAYHERO_AUTH_TOKEN;
    delete process.env.PAYHERO_API_USERNAME;
    delete process.env.PAYHERO_API_PASSWORD;
    delete process.env.PAYHERO_CHANNEL_ID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("normalizes Kenyan M-Pesa phone formats to 254...", () => {
    expect(normalizePayHeroPhone("0729596165")).toBe("254729596165");
    expect(normalizePayHeroPhone("0112345678")).toBe("254112345678");
    expect(normalizePayHeroPhone("+254 729 596 165")).toBe("254729596165");
    expect(normalizePayHeroPhone("729596165")).toBe("254729596165");
    expect(normalizePayHeroPhone("12345")).toBeNull();
  });

  it("builds Basic auth header from direct token or username/password", () => {
    process.env.PAYHERO_AUTH_TOKEN = "Basic abc123";
    expect(getPayHeroAuthHeader()).toBe("Basic abc123");

    process.env.PAYHERO_AUTH_TOKEN = "xyz789";
    expect(getPayHeroAuthHeader()).toBe("Basic xyz789");

    delete process.env.PAYHERO_AUTH_TOKEN;
    process.env.PAYHERO_API_USERNAME = "user1";
    process.env.PAYHERO_API_PASSWORD = "pass1";
    expect(getPayHeroAuthHeader()).toBe(
      `Basic ${Buffer.from("user1:pass1").toString("base64")}`
    );
  });

  it("parses successful and failed PayHero callbacks", () => {
    const ok = parsePayHeroCallback({
      response: {
        Amount: 250,
        CheckoutRequestID: "ws_CO_12345",
        ExternalReference: "order_abc123",
        MpesaReceiptNumber: "RGH75XYZ12",
        Phone: "254729596165",
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        Status: "Success",
      },
    });
    expect(ok.isSuccess).toBe(true);
    expect(ok.mpesaReceiptNumber).toBe("RGH75XYZ12");
    expect(ok.externalReference).toBe("order_abc123");
    expect(ok.amount).toBe(250);

    const cancelled = parsePayHeroCallback({
      response: {
        ExternalReference: "order_abc123",
        ResultCode: 1032,
        ResultDesc: "Request cancelled by user",
        Status: "Failed",
      },
    });
    expect(cancelled.isSuccess).toBe(false);
    expect(cancelled.resultCode).toBe(1032);
  });
});
