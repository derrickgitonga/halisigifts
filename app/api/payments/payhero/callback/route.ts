import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, safeCompareSecret } from "@/lib/rate-limit";
import { parsePayHeroCallback } from "@/lib/payhero";
import { sendOrderStatusEmail, toEmailOrder } from "@/lib/order-emails";

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`payhero-cb:${getClientIp(req)}`, { limit: 60, windowMs: 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 });
  }

  const expectedSecret = process.env.PAYHERO_CALLBACK_SECRET?.trim();
  if (expectedSecret) {
    const providedToken = req.nextUrl.searchParams.get("token");
    if (!safeCompareSecret(providedToken, expectedSecret)) {
      return NextResponse.json({ success: false, error: "Unauthorized callback" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const cb = parsePayHeroCallback(body);
  if (!cb.externalReference && !cb.checkoutRequestId) {
    return NextResponse.json({ success: false, error: "Missing order reference" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        ...(cb.externalReference ? [{ id: cb.externalReference }] : []),
        ...(cb.checkoutRequestId ? [{ paymentReference: `payhero:${cb.checkoutRequestId}` }] : []),
      ],
    },
    include: {
      items: { include: { product: { select: { name: true, slug: true } } } },
    },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  // Idempotency: if already marked PAID, acknowledge immediately without duplicate side effects
  if (order.status === "PAID") {
    return NextResponse.json({ success: true, alreadyProcessed: true });
  }

  if (!cb.isSuccess) {
    console.warn("[PayHero Callback] Payment failed/cancelled:", {
      orderId: order.id,
      status: cb.status,
      resultCode: cb.resultCode,
      resultDesc: cb.resultDesc,
    });
    return NextResponse.json({ success: true, recorded: "FAILED" });
  }

  // Verify amount paid is not tampered below expected upfront amount
  const expectedAmount = Math.round(
    Number(order.amountDueNow) > 0 ? Number(order.amountDueNow) : Number(order.total)
  );
  if (cb.amount !== null && cb.amount + 1 < expectedAmount) {
    console.error("[PayHero Callback] Underpayment detected:", {
      orderId: order.id,
      paid: cb.amount,
      expected: expectedAmount,
    });
    return NextResponse.json({ success: false, error: "Amount mismatch" }, { status: 400 });
  }

  const existingAddr = (order.shippingAddress ?? {}) as Record<string, unknown>;
  const receipt = cb.mpesaReceiptNumber || cb.checkoutRequestId || order.paymentReference || "PAID";

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "PAID",
      paymentReference: receipt,
      shippingAddress: {
        ...existingAddr,
        ...(cb.mpesaReceiptNumber ? { mpesaTransactionCode: cb.mpesaReceiptNumber } : {}),
      },
    },
    include: {
      items: { include: { product: { select: { name: true, slug: true } } } },
    },
  });

  after(async () => {
    try {
      await sendOrderStatusEmail(toEmailOrder(updated));
    } catch (err) {
      console.error("[PayHero Callback] status email failed:", err);
    }
  });

  return NextResponse.json({ success: true, status: "PAID", receipt });
}
