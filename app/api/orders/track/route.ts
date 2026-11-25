import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseOfflineError } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  displayOrderNumber,
  normaliseOrderRef,
  parseOrderNumber,
  phonesMatch,
  type TrackedOrder,
  type TrackedStatus,
} from "@/lib/order-tracking";

const TrackSchema = z.object({
  order: z.string().trim().min(6, "Enter your order number").max(40),
  contact: z.string().trim().min(5, "Enter the phone number or email used at checkout").max(120),
});

// Same answer for "no such order" and "details don't match" so order numbers can't be probed
const NOT_FOUND = {
  success: false,
  error: "We couldn't find an order with those details. Check the order number and the phone or email you used at checkout.",
};

export async function POST(req: NextRequest) {
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const limit = checkRateLimit(`track-order:${clientIp}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: `Too many attempts. Please try again in ${Math.ceil(limit.retryAfterSeconds / 60)} min.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
  const parsed = TrackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid details" },
      { status: 400 }
    );
  }

  const orderNumber = parseOrderNumber(parsed.data.order);
  const ref = normaliseOrderRef(parsed.data.order);
  const contact = parsed.data.contact;

  try {
    // HG-10001 → order number; full ID → exact match; legacy short reference → suffix match
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
      return contact.includes("@")
        ? email !== "" && email === contact.toLowerCase()
        : Boolean(addr.phoneNumber && phonesMatch(addr.phoneNumber, contact));
    });

    if (!order) return NextResponse.json(NOT_FOUND, { status: 404 });

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
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (isDatabaseOfflineError(error)) {
      return NextResponse.json(
        {
          success: false,
          offline: true,
          error: "Order tracking is temporarily unavailable. Please WhatsApp us your order number and we'll update you right away.",
        },
        { status: 503 }
      );
    }
    console.error("[track-order]", error);
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
