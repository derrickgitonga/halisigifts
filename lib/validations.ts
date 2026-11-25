import { z } from "zod";
import { isRiderZone } from "./kenya-counties";

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const CartItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  variantId: z.string().optional(),
  variantName: z.string().optional(),
});

export const ShippingAddressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email address is required"),
  phoneNumber: z.string().min(10, "Valid phone number (e.g. 0712345678 or 254712345678) is required"),
  addressLine: z.string().optional().default(""),
  city: z.string().optional().default(""),
  county: z.string().optional(),
  engravingText: z.string().optional(),
  engravingFee: z.number().optional().default(0),
  customerNote: z.string().optional(),
  mpesaTransactionCode: z.string().optional(),
});

export const CheckoutSchema = z
  .object({
    shippingAddress: ShippingAddressSchema,
    phoneNumber: z.string().optional(),
    fulfillment: z.enum(["PICKUP", "DELIVERY"]),
    county: z.string().nullable().optional(),
    paymentMethod: z.enum(["MPESA", "CARD", "CASH_ON_DELIVERY"]),
    payFullUpfrontForDiscount: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment === "DELIVERY") {
      if (!data.county) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "County is required for delivery",
          path: ["county"],
        });
      }
      if (!data.shippingAddress.addressLine || data.shippingAddress.addressLine.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Delivery address is required for delivery",
          path: ["shippingAddress", "addressLine"],
        });
      }
    }
    if (data.paymentMethod === "CASH_ON_DELIVERY" && data.fulfillment !== "PICKUP") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cash payment is only available for pickup at shop",
        path: ["paymentMethod"],
      });
    }
    if (data.fulfillment === "DELIVERY" && data.paymentMethod !== "MPESA") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only M-Pesa is accepted for delivery orders",
        path: ["paymentMethod"],
      });
    }
  });

export const ReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().min(5, "Review comment must be at least 5 characters"),
});
