import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseOfflineError } from "@/lib/prisma";
import { checkRateLimit, getClientIp, safeCompareSecret } from "@/lib/rate-limit";
import {
  displayOrderNumber,
  normaliseOrderRef,
  parseOrderNumber,
  phonesMatch,
  type TrackedOrder,
  type TrackedStatus,
} from "@/lib/order-tracking";

const TrackSchema = z.object({
  order: z
    .string()
    .trim()
    .min(5, "Enter your order number")
    .max(40)
    .regex(/^[#a-zA-Z0-9\s-]+$/, "Enter a valid order number"),
  contact: z.string().trim().min(5, "Enter the phone number or email used at checkout").max(120),
});

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, private",
  "X-Robots-Tag": "noindex, nofollow",
};

// Same answer for "no such order" and "details don't match" so order numbers can't be probed
const NOT_FOUND = {
  success: false,
  error: "We couldn't find an order with those details. Check the order number and the phone or email you used at checkout.",
};

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const ipLimit = checkRateLimit(`track-order:ip:${clientIp}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { success: false, error: `Too many attempts. Please try again in ${Math.ceil(ipLimit.retryAfterSeconds / 60)} min.` },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(ipLimit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400, headers: NO_STORE_HEADERS });
  }
  const parsed = TrackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid details" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const orderNumber = parseOrderNumber(parsed.data.order);
  const ref = normaliseOrderRef(parsed.data.order);
  const contact = parsed.data.contact.trim();

  // Per-order-reference throttle to block distributed botnet brute-force on a single order number
  const refKey = orderNumber !== null ? `num:${orderNumber}` : `ref:${ref}`;
  const refLimit = checkRateLimit(`track-order:${refKey}`, { limit: 15, windowMs: 15 * 60 * 1000 });
  if (!refLimit.allowed) {
    return NextResponse.json(
      { success: false, error: `Too many attempts for this order. Please try again in ${Math.ceil(refLimit.retryAfterSeconds / 60)} min.` },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(refLimit.retryAfterSeconds) } }
    );
  }

  try {
    // HG-10001 -> order number; full ID -> exact match; legacy short reference -> suffix match
    const candidates = await prisma.order.findMany({
      where:
        orderNumber !== null
          ? { orderNumber }
          : ref.length >= 20
            ? { id: ref }
            : { id: { endsWith: ref } },
      take: 5,
      include: {
        items: { include: { product: { select: { name: true, slug: true } } } },
      },
    });

    const order = candidates.find((o) => {
      const addr = (o.shippingAddress ?? {}) as { email?: string; phoneNumber?: string };
      const email = (addr.email || o.guestEmail || "").trim().toLowerCase();
      if (contact.includes("@")) {
        return email !== "" && safeCompareSecret(email, contact.toLowerCase());
      }
      return Boolean(addr.phoneNumber && phonesMatch(addr.phoneNumber, contact));
    });

    if (!order) return NextResponse.json(NOT_FOUND, { status: 404, headers: NO_STORE_HEADERS });

    const result: TrackedOrder = {
      reference: displayOrderNumber(order),
      status: order.status as TrackedStatus,
      placedAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      deliveryMethod: order.deliveryMethod,
      county: order.county,
      paymentMethod: order.paymentMethod,
      total: Number(order.total),
      amountDueOnDelivery: Number(order.amountDueOnDelivery),
      items: order.items.map((it) => ({
        name: it.product.name,
        slug: it.product.slug,
        variantName: it.variantName,
        quantity: it.quantity,
        price: Number(it.priceAtPurchase),
      })),
    };

    return NextResponse.json(
      { success: true, order: result },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    if (isDatabaseOfflineError(error)) {
      return NextResponse.json(
        {
          success: false,
          offline: true,
          error: "Order tracking is temporarily unavailable. Please WhatsApp us your order number and we'll update you right away.",
        },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }
    console.error("[track-order]", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
