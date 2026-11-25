import { describe, it, expect } from "vitest";
import { getQuickWhatsAppCheckoutUrl, slugifyVariant } from "@/lib/whatsapp-checkout";

describe("WhatsApp Quick Checkout Suite", () => {
  it("slugifies variant names correctly", () => {
    expect(slugifyVariant(" Silver / Mesh ")).toBe("silver-mesh");
    expect(slugifyVariant("Rose Gold")).toBe("rose-gold");
  });

  it("generates WhatsApp checkout URL with product name, price, and slug", () => {
    const url = getQuickWhatsAppCheckoutUrl({
      productName: "Casio Digital Watch",
      productSlug: "casio-digital-watch",
      price: 2400,
    });

    expect(url).toContain("https://wa.me/254729596165?text=");
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain("Casio Digital Watch");
    expect(decoded).toContain("KES 2,400");
    expect(decoded).toContain("/product/casio-digital-watch");
  });

  it("includes selected variant in WhatsApp checkout URL message when provided", () => {
    const url = getQuickWhatsAppCheckoutUrl({
      productName: "Naviforce Chronograph",
      productSlug: "naviforce-chronograph",
      price: 4500,
      variantName: "Gold Chain",
    });

    const decoded = decodeURIComponent(url);
    expect(decoded).toContain("Option: Gold Chain");
    expect(decoded).toContain("?variant=gold-chain");
  });
});
