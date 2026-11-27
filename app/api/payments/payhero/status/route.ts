import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { fetchPayHeroTransactionStatus } from "@/lib/payhero";

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(`payhero-status:${getClientIp(req)}`, { limit: 60, windowMs: 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const orderId = req.nextUrl.searchParams.get("orderId")?.trim();
  if (!orderId || orderId.length < 10 || orderId.length > 50) {
    return NextResponse.json({ success: false, error: "Invalid orderId" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      paymentReference: true,
      shippingAddress: true,
    },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  const headers = {
    "Cache-Control": "no-store, private",
    "X-Robots-Tag": "noindex, nofollow",
  };

  if (order.status === "PAID") {
    const addr = (order.shippingAddress ?? {}) as { mpesaTransactionCode?: string };
    return NextResponse.json(
      {
        success: true,
        status: "PAID",
        paid: true,
        receipt: addr.mpesaTransactionCode || order.paymentReference || null,
      },
      { headers }
    );
  }

  // Fallback poll to PayHero API if webhook hasn't arrived yet
  if (order.status === "PENDING" && order.paymentReference?.startsWith("payhero:")) {
    const ref = order.paymentReference.slice("payhero:".length);
    const remote = await fetchPayHeroTransactionStatus(ref);
    if (remote.success && (remote.status === "SUCCESS" || remote.status === "COMPLETED")) {
      const receipt = remote.mpesaReceiptNumber || ref;
      const existingAddr = (order.shippingAddress ?? {}) as Record<string, unknown>;
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paymentReference: receipt,
          shippingAddress: {
            ...existingAddr,
            ...(remote.mpesaReceiptNumber ? { mpesaTransactionCode: remote.mpesaReceiptNumber } : {}),
          },
        },
      });
      return NextResponse.json({ success: true, status: "PAID", paid: true, receipt }, { headers });
    }
    if (remote.success && (remote.status === "FAILED" || remote.status === "CANCELLED")) {
      return NextResponse.json({ success: true, status: "FAILED", paid: false, receipt: null }, { headers });
    }
  }

  return NextResponse.json(
    { success: true, status: order.status, paid: false, receipt: null },
    { headers }
  );
}
