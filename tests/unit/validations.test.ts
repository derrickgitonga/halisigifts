import { describe, it, expect } from "vitest";
import { RegisterSchema, ShippingAddressSchema, CheckoutSchema } from "@/lib/validations";

describe("Input Validations with Zod", () => {
  it("validates user registration data", () => {
    const valid = RegisterSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "securepassword",
    });
    expect(valid.success).toBe(true);

    const invalid = RegisterSchema.safeParse({
      name: "J",
      email: "invalid-email",
      password: "123",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates Kenya shipping address", () => {
    const address = ShippingAddressSchema.safeParse({
      fullName: "Jane Wanjiru",
      email: "jane@example.com",
      phoneNumber: "0712345678",
      addressLine: "Kimathi Street, Suite 4",
      city: "Nairobi",
      county: "Nairobi",
    });
    expect(address.success).toBe(true);
  });

  it("validates simplified checkout payload", () => {
    const pickupCheckout = CheckoutSchema.safeParse({
      shippingAddress: {
        fullName: "Jane Wanjiru",
        email: "jane@example.com",
        phoneNumber: "0712345678",
        addressLine: "Kimathi Street, Suite 4",
        city: "Nairobi",
        county: "Nairobi",
      },
      phoneNumber: "254712345678",
      fulfillment: "PICKUP",
      county: null,
      paymentMethod: "MPESA",
    });
    expect(pickupCheckout.success).toBe(true);

    const deliveryCheckout = CheckoutSchema.safeParse({
      shippingAddress: {
        fullName: "Jane Wanjiru",
        email: "jane@example.com",
        phoneNumber: "0712345678",
        addressLine: "Kimathi Street, Suite 4",
        city: "Nairobi",
        county: "Nairobi",
      },
      phoneNumber: "254712345678",
      fulfillment: "DELIVERY",
      county: "Nairobi",
      paymentMethod: "MPESA",
    });
    expect(deliveryCheckout.success).toBe(true);

    const invalidCOD = CheckoutSchema.safeParse({
      shippingAddress: {
        fullName: "Jane Wanjiru",
        email: "jane@example.com",
        phoneNumber: "0712345678",
        addressLine: "Kimathi Street, Suite 4",
        city: "Mombasa",
        county: "Mombasa",
      },
      phoneNumber: "254712345678",
      fulfillment: "DELIVERY",
      county: "Mombasa",
      paymentMethod: "CASH_ON_DELIVERY",
    });
    expect(invalidCOD.success).toBe(false);
  });
});
