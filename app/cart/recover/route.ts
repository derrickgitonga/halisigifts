import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim();
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/+$/, "");

  if (!token) {
    return NextResponse.redirect(new URL("/cart?error=missing_recovery_token", baseUrl));
  }

  try {
    const cartSession = await prisma.cartSession.findUnique({
      where: { recoveryToken: token },
      include: {
        items: true,
      },
    });

    if (!cartSession || cartSession.items.length === 0) {
      return NextResponse.redirect(
        new URL("/cart?notice=expired_or_empty_cart", baseUrl)
      );
    }

    // 7-day expiration check
    const tokenTimestamp = cartSession.lastReminderAt || cartSession.abandonedAt || cartSession.createdAt;
    const isExpired = Date.now() - new Date(tokenTimestamp).getTime() > TOKEN_EXPIRY_MS;

    if (isExpired) {
      return NextResponse.redirect(
        new URL("/cart?notice=token_expired", baseUrl)
      );
    }

    if (cartSession.status === "CONVERTED" || cartSession.status === "RECOVERED") {
      return NextResponse.redirect(
        new URL("/cart?notice=already_completed", baseUrl)
      );
    }

    if (cartSession.status === "ABANDONED") {
      await prisma.cartSession.update({
        where: { id: cartSession.id },
        data: {
          status: "ACTIVE",
          lastActiveAt: new Date(),
        },
      });
    }

    const response = NextResponse.redirect(new URL("/checkout?recovered=true", baseUrl));

    response.cookies.set("halisi_guest_session", cartSession.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/cart?error=recovery_failed", baseUrl));
  }
}
