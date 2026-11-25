import { describe, it, expect } from "vitest";
import { buildWhatsAppOrderMessage, getCustomerWhatsAppUrl, WhatsAppOrderData } from "@/lib/whatsapp-order";

describe("Admin Orders & WhatsApp Message Suite", () => {
  const sampleOrder: WhatsAppOrderData = {
    orderId: "cm7890abcd",
    fullName: "John Kamau",
    phoneNumber: "0722123456",
    email: "john.kamau@example.com",
    fulfillment: "DELIVERY",
    county: "Nairobi",
    addressLine: "Westlands, Rhapta Road Apt 4B",
    items: [
      {
        name: "Hublot Automatic Gents Watch",
        slug: "hublot-automatic-gents-watch",
        variantName: "Gold",
        quantity: 1,
        price: 8500,
      },
      {
        name: "Executive Wooden Watch Box",
        slug: "wooden-executive-boxes",
        quantity: 1,
        price: 2500,
      },
    ],
    subtotal: 11000,
    deliveryFee: 350,
    engravingText: "To John with Love - 2026",
    engravingFee: 200,
    discountAmount: 550,
    total: 11000,
    amountDueNow: 11000,
    amountDueOnDelivery: 0,
    paymentMethod: "MPESA",
    mpesaTransactionCode: "SDH99876XZ",
    customerNote: "Please deliver between 2 PM and 5 PM",
  };

  it("builds correct structured WhatsApp order message matching customer confirmation", () => {
    const msg = buildWhatsAppOrderMessage(sampleOrder);

    expect(msg).toContain("*NEW ORDER - HALISI GIFTS SHOP*");
    expect(msg).toContain("Order ID: #cm7890abcd");
    expect(msg).toContain("• Name: John Kamau");
    expect(msg).toContain("• Phone: 0722123456");
    expect(msg).toContain("• Fulfillment: Delivery");
    expect(msg).toContain("• County: Nairobi");
    expect(msg).toContain("• Address: Westlands, Rhapta Road Apt 4B");
    expect(msg).toContain("Hublot Automatic Gents Watch (Gold) - KES 8,500");
    expect(msg).toContain("Executive Wooden Watch Box - KES 2,500");
    expect(msg).toContain('*Custom Engraving:*\n"To John with Love - 2026" (+KES 200)');
    expect(msg).toContain("• Subtotal: KES 11,000");
    expect(msg).toContain("• Delivery Fee: KES 350");
    expect(msg).toContain("• Discount: -KES 550");
    expect(msg).toContain("• Total: KES 11,000");
    expect(msg).toContain("• M-Pesa Confirmation: SDH99876XZ");
    expect(msg).toContain('*Note to Seller:*\n"Please deliver between 2 PM and 5 PM"');
  });

  it("generates direct customer WhatsApp deep link with international prefix 254", () => {
    const msg = buildWhatsAppOrderMessage(sampleOrder);
    const waUrl = getCustomerWhatsAppUrl("0722123456", msg);

    expect(waUrl).toContain("https://wa.me/254722123456?text=");
    expect(waUrl).toContain(encodeURIComponent("Order ID: #cm7890abcd"));
  });

  it("formats pickup orders correctly without county address", () => {
    const pickupOrder: WhatsAppOrderData = {
      ...sampleOrder,
      fulfillment: "PICKUP",
      deliveryFee: 0,
      county: null,
      addressLine: undefined,
    };

    const msg = buildWhatsAppOrderMessage(pickupOrder);
    expect(msg).toContain("• Fulfillment: Pickup at Shop (Free)");
    expect(msg).not.toContain("• Address:");
  });
});
