import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CartItemSchema } from "@/lib/validations";
import { getSessionOrUserId, getOrCreateCartSession, getExistingCartSession } from "@/lib/cart-session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET() {
  const sessionOrUserId = await getSessionOrUserId();
  const cartSession = await getExistingCartSession(sessionOrUserId);

  if (!cartSession && !sessionOrUserId) {
    return NextResponse.json({ success: true, items: [] });
  }

  const cartItems = await prisma.cartItem.findMany({
    where: {
      OR: [
        ...(cartSession ? [{ cartSessionId: cartSession.id }] : []),
        ...(sessionOrUserId ? [{ sessionOrUserId }] : []),
      ],
    },
    include: {
      product: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const response = NextResponse.json({ success: true, items: cartItems });
  if (!sessionOrUserId.startsWith("user_")) {
    response.cookies.set("halisi_guest_session", sessionOrUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`cart-post:${getClientIp(req)}`, { limit: 40, windowMs: 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many cart requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }
  try {
    const body = await req.json();
    const parsed = CartItemSchema.parse(body);
    const sessionOrUserId = await getSessionOrUserId();
    const cartSession = await getOrCreateCartSession(sessionOrUserId);

    const existing = await prisma.cartItem.findFirst({
      where: {
        OR: [
          {
            cartSessionId: cartSession.id,
            productId: parsed.productId,
            variantName: parsed.variantName || null,
          },
          {
            sessionOrUserId,
            productId: parsed.productId,
            variantName: parsed.variantName || null,
          },
        ],
      },
    });

    let item;
    if (existing) {
      item = await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + parsed.quantity,
          cartSessionId: cartSession.id,
          variantId: parsed.variantId || existing.variantId,
          variantName: parsed.variantName || existing.variantName,
        },
      });
    } else {
      item = await prisma.cartItem.create({
        data: {
          sessionOrUserId,
          cartSessionId: cartSession.id,
          productId: parsed.productId,
          variantId: parsed.variantId || null,
          variantName: parsed.variantName || null,
          quantity: parsed.quantity,
        },
      });
    }

    await prisma.cartSession.update({
      where: { id: cartSession.id },
      data: {
        lastActiveAt: new Date(),
        status: "ACTIVE",
      },
    });

    const response = NextResponse.json({ success: true, item });
    if (!sessionOrUserId.startsWith("user_")) {
      response.cookies.set("halisi_guest_session", sessionOrUserId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add to cart";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json({ success: false, error: "Cart Item ID required" }, { status: 400 });
    }

    const sessionOrUserId = await getSessionOrUserId();
    const cartSession = await getOrCreateCartSession(sessionOrUserId);

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    await prisma.cartSession.update({
      where: { id: cartSession.id },
      data: { lastActiveAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete item";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId, quantity } = body;

    if (!itemId || typeof quantity !== "number" || quantity <= 0) {
      return NextResponse.json({ success: false, error: "Invalid item ID or quantity" }, { status: 400 });
    }

    const sessionOrUserId = await getSessionOrUserId();
    const cartSession = await getOrCreateCartSession(sessionOrUserId);

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity,
        cartSessionId: cartSession.id,
      },
    });

    await prisma.cartSession.update({
      where: { id: cartSession.id },
      data: {
        lastActiveAt: new Date(),
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update item";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
