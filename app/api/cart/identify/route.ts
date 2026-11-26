import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getOrCreateCartSession } from "@/lib/cart-session";
import { captureCustomerLeadAsync } from "@/lib/crm";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { CrmSource } from "@prisma/client";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`cart-identify:${getClientIp(req)}`, { limit: 15, windowMs: 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }
  try {
    const body = await req.json();
    const { email, customerName } = body;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Valid email address is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = typeof customerName === "string" ? customerName.trim() : null;

    const cookieStore = await cookies();
    let guestId = cookieStore.get("halisi_guest_session")?.value;
    if (!guestId) {
      guestId = "guest_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    const cartSession = await getOrCreateCartSession(guestId);

    const updated = await prisma.cartSession.update({
      where: { id: cartSession.id },
      data: {
        email: cleanEmail,
        customerName: cleanName || cartSession.customerName,
        lastActiveAt: new Date(),
      },
    });

    captureCustomerLeadAsync({
      name: cleanName || cartSession.customerName,
      email: cleanEmail,
      source: CrmSource.CART,
      tags: ["Cart Visitor"],
    }).catch(() => {});

    const response = NextResponse.json({
      success: true,
      cartSessionId: updated.id,
      email: updated.email,
    });

    if (!guestId.startsWith("user_")) {
      response.cookies.set("halisi_guest_session", guestId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to identify cart session";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
