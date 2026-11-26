import { describe, it, expect } from "vitest";
import {
  buildNewOrderAlertEmail,
  buildOrderConfirmationEmail,
  buildOrderStatusEmail,
  type EmailOrder,
} from "@/lib/order-emails";
import { displayOrderNumber, formatOrderNumber, parseOrderNumber } from "@/lib/order-tracking";
import { buildWhatsAppOrderMessage } from "@/lib/whatsapp-order";

function order(overrides: Partial<EmailOrder> = {}): EmailOrder {
  return {
    id: "cmabc123def456ghk3f9a2qz",
    orderNumber: 10042,
    status: "PENDING",
    createdAt: new Date("2026-11-25T08:00:00Z"),
    deliveryMethod: "RIDER",
    county: "Nairobi",
    paymentMethod: "MPESA",
    subtotal: 5000,
    deliveryFee: 200,
    engravingFee: 0,
    discountAmount: 0,
    total: 5200,
    amountDueNow: 200,
    amountDueOnDelivery: 5000,
    guestEmail: "jane@example.com",
    shippingAddress: {
      fullName: "Jane <b>Wanjiku</b>",
      email: "jane@example.com",
      phoneNumber: "0712345678",
      addressLine: "Westlands",
    },
    items: [{ name: "Asad 100ml", slug: "asad", variantName: null, quantity: 2, price: 2500 }],
    ...overrides,
  };
}

describe("order numbers", () => {
  it("formats and parses HG numbers", () => {
    expect(formatOrderNumber(10001)).toBe("HG-10001");
    for (const input of ["HG-10001", "hg10001", "#10001", " 10001 ", "HG 10001"]) {
      expect(parseOrderNumber(input)).toBe(10001);
    }
    expect(parseOrderNumber("K3F9A2QZ")).toBeNull();
  });

  it("falls back to the legacy short reference for old orders", () => {
    expect(displayOrderNumber({ id: "cmabc123def456ghk3f9a2qz", orderNumber: null })).toBe("K3F9A2QZ");
    expect(displayOrderNumber({ id: "x", orderNumber: 10042 })).toBe("HG-10042");
  });

  it("puts the order number and tracking link in the WhatsApp message", () => {
    const msg = buildWhatsAppOrderMessage({
      orderId: "cmabc123def456ghk3f9a2qz",
      orderNumber: "HG-10042",
      fullName: "Jane",
      phoneNumber: "0712345678",
      email: "jane@example.com",
      fulfillment: "PICKUP",
      items: [{ name: "Asad", quantity: 1, price: 2500 }],
      subtotal: 2500,
      deliveryFee: 0,
      total: 2500,
      paymentMethod: "MPESA",
    });
    expect(msg).toContain("Order No: HG-10042");
    expect(msg).toContain("/track-order?order=HG-10042");
  });
});

describe("order emails", () => {
  it("confirmation includes number, items, totals, M-Pesa summary and tracking link", () => {
    const { subject, html } = buildOrderConfirmationEmail(order());
    expect(subject).toBe("Order HG-10042 received – Halisi Gifts");
    expect(html).toContain("Asad 100ml");
    expect(html).toContain("KSh 5,200");
    expect(html).toContain("Lipa na M-Pesa");
    expect(html).not.toContain("8223592");
    expect(html).toContain("/track-order?order=HG-10042");
  });

  it("escapes customer-entered text", () => {
    const { html } = buildOrderConfirmationEmail(order());
    expect(html).not.toContain("<b>Wanjiku</b>");
    expect(html).toContain("Jane");
    const alert = buildNewOrderAlertEmail(order());
    expect(alert.html).toContain("Jane &lt;b&gt;Wanjiku&lt;/b&gt;");
  });

  it("acknowledges an M-Pesa code instead of asking for payment", () => {
    const { html } = buildOrderConfirmationEmail(
      order({ shippingAddress: { ...order().shippingAddress, mpesaTransactionCode: "SKL7ABC123" } })
    );
    expect(html).toContain("SKL7ABC123");
    expect(html).not.toContain("Pay <strong>");
  });

  it("status emails: correct copy per status and delivery method, none for PENDING", () => {
    expect(buildOrderStatusEmail(order({ status: "PENDING" }))).toBeNull();
    expect(buildOrderStatusEmail(order({ status: "PROCESSING" }))?.subject).toBe(
      "Your order is confirmed – HG-10042"
    );
    expect(buildOrderStatusEmail(order({ status: "SHIPPED" }))?.subject).toContain("on the way");
    expect(buildOrderStatusEmail(order({ status: "SHIPPED", deliveryMethod: "PICKUP" }))?.subject).toContain(
      "ready for pickup"
    );
    expect(buildOrderStatusEmail(order({ status: "CANCELLED" }))?.html).toContain("cancelled");
  });
});
