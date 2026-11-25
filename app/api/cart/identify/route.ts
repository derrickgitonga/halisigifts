import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getOrCreateCartSession } from "@/lib/cart-session";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
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
