import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { initiatePayHeroStkPush, isPayHeroConfigured } from "@/lib/payhero";

const StkPushSchema = z.object({
  orderId: z.string().trim().min(10).max(50),
  phoneNumber: z.string().trim().min(9).max(20).optional(),
});

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`payhero-stk:${getClientIp(req)}`, { limit: 10, windowMs: 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many payment attempts. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  if (!isPayHeroConfigured()) {
    return NextResponse.json(
      { success: false, notConfigured: true, error: "PayHero M-Pesa gateway is not yet configured" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = StkPushSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Invalid payment request" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  if (order.status === "PAID" || order.status === "DELIVERED" || order.status === "SHIPPED") {
    return NextResponse.json({ success: true, alreadyPaid: true, status: order.status });
  }

  if (order.status === "CANCELLED") {
    return NextResponse.json({ success: false, error: "This order has been cancelled" }, { status: 400 });
  }

  // Always compute payable amount strictly on the server
  const dueNow = Number(order.amountDueNow);
  const amountToCharge = Math.round(dueNow > 0 ? dueNow : Number(order.total));
  if (amountToCharge <= 0) {
    return NextResponse.json({ success: false, error: "No upfront payment required for this order" }, { status: 400 });
  }

  const addr = (order.shippingAddress ?? {}) as { fullName?: string; phoneNumber?: string };
  const phone = parsed.data.phoneNumber || addr.phoneNumber || "";
  if (!phone) {
    return NextResponse.json({ success: false, error: "M-Pesa phone number is required" }, { status: 400 });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");
  const callbackSecret = process.env.PAYHERO_CALLBACK_SECRET?.trim();
  const callbackUrl = callbackSecret
    ? `${siteUrl}/api/payments/payhero/callback?token=${encodeURIComponent(callbackSecret)}`
    : `${siteUrl}/api/payments/payhero/callback`;

  const result = await initiatePayHeroStkPush({
    amount: amountToCharge,
    phoneNumber: phone,
    externalReference: order.id,
    customerName: addr.fullName,
    callbackUrl,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error || "Failed to send M-Pesa prompt" },
      { status: 502 }
    );
  }

  const payheroRef = result.checkoutRequestId || result.reference || order.id;
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentReference: `payhero:${payheroRef}` },
  });

  return NextResponse.json(
    {
      success: true,
      orderId: order.id,
      amount: amountToCharge,
      reference: payheroRef,
      message: "M-Pesa PIN prompt sent to your phone. Enter your PIN to complete payment.",
    },
    { headers: { "Cache-Control": "no-store, private" } }
  );
}
