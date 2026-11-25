import { describe, it, expect } from "vitest";
import {
  generateAbandonedCartHtml,
  sendAbandonedCartEmail,
  sendAdminAbandonedCartAlert,
} from "@/lib/email";

describe("Abandoned Cart CRON & Email Suite", () => {
  const mockSession = {
    id: "cart_session_123",
    email: "customer@example.com",
    customerName: "Jane Doe",
    recoveryToken: "rec_tok_abc123xyz",
    items: [
      {
        id: "item_1",
        quantity: 1,
        product: {
          id: "prod_1",
          name: "Casio Vintage Gold Watch",
          slug: "casio-vintage-gold-watch",
          price: 4500,
          compareAtPrice: 5500,
          images: ["/products/casio-watch.jpg"],
        },
      },
    ],
  };

  it("generates Tier 1 email HTML with recovery link and product details", () => {
    const html = generateAbandonedCartHtml(mockSession, 1);

    expect(html).toContain("Halisi Gifts");
    expect(html).toContain("Hello Jane Doe,");
    expect(html).toContain("Did you forget something special?");
    expect(html).toContain("Casio Vintage Gold Watch");
    expect(html).toContain("KES 4,500");
    expect(html).toContain("/cart/recover?token=rec_tok_abc123xyz");
  });

  it("generates Tier 2 email HTML with special saved copy", () => {
    const html = generateAbandonedCartHtml(mockSession, 2);

    expect(html).toContain("Your cart misses you");
    expect(html).toContain("Saved with Care for You");
    expect(html).toContain("/cart/recover?token=rec_tok_abc123xyz");
  });

  it("generates Tier 3 email HTML with final reminder copy", () => {
    const html = generateAbandonedCartHtml(mockSession, 3);

    expect(html).toContain("Your cart misses you");
    expect(html).toContain("Reserved for You");
    expect(html).toContain("/cart/recover?token=rec_tok_abc123xyz");
  });

  it("handles email sending mock gracefully when Resend API key is not configured", async () => {
    const result = await sendAbandonedCartEmail(mockSession, 1);
    expect(result.success).toBe(true);
    expect(result.messageId).toContain("mock_");
  });

  it("does not dispatch Resend emails for admin abandoned cart alerts to save tokens", async () => {
    const result = await sendAdminAbandonedCartAlert({
      sentCount: 3,
      byTier: { tier1: 2, tier2: 1, tier3: 0 },
      details: [
        {
          email: "customer@example.com",
          tier: 1,
          status: "SENT",
          cartSessionId: "cart_session_123",
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
