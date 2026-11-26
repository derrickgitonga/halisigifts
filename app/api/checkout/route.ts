import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { sendNewOrderEmails, toEmailOrder } from "@/lib/order-emails";
import { displayOrderNumber } from "@/lib/order-tracking";
import { prisma } from "@/lib/prisma";
import { CheckoutSchema } from "@/lib/validations";
import { resolveDelivery } from "@/lib/delivery";
import { cookies } from "next/headers";
import { sendCapiEvent } from "@/lib/meta-capi";
import { sendTikTokEvent } from "@/lib/tiktok-events-api";
import { checkRateLimit } from "@/lib/rate-limit";
import { captureCustomerLeadAsync } from "@/lib/crm";
import { CrmSource } from "@prisma/client";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateLimit = checkRateLimit(`checkout:${clientIp}`, { limit: 20, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many checkout attempts. Please wait a moment before trying again." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }
    let guestId: string | undefined;
    let fbp: string | undefined;
    let fbc: string | undefined;
    let ttp: string | undefined;

    try {
      const cookieStore = await cookies();
      guestId = cookieStore.get("halisi_guest_session")?.value;
      fbp = cookieStore.get("_fbp")?.value;
      fbc = cookieStore.get("_fbc")?.value;
      ttp = cookieStore.get("_ttp")?.value;
    } catch {
      guestId = req.cookies.get("halisi_guest_session")?.value;
      fbp = req.cookies.get("_fbp")?.value;
      fbc = req.cookies.get("_fbc")?.value;
      ttp = req.cookies.get("_ttp")?.value;
    }

    const sessionOrUserId = guestId || "";

    const body = await req.json();
    const parsed = CheckoutSchema.parse(body);

    const { fulfillment, county, paymentMethod, payFullUpfrontForDiscount } = parsed;

    const { deliveryMethod, fee: deliveryFee } = resolveDelivery(
      county ?? null,
      fulfillment
    );

    if (fulfillment === "DELIVERY" && paymentMethod !== "MPESA") {
      return NextResponse.json(
        { success: false, error: "Only M-Pesa is accepted for delivery orders" },
        { status: 400 }
      );
    }

    if (paymentMethod === "CASH_ON_DELIVERY" && fulfillment !== "PICKUP") {
      return NextResponse.json(
        { success: false, error: "Cash payment is only available for pickup orders" },
        { status: 400 }
      );
    }

    const cartSession = await prisma.cartSession.findFirst({
      where: {
        OR: [
          ...(sessionOrUserId ? [{ sessionToken: sessionOrUserId }] : []),
          { email: parsed.shippingAddress.email.trim().toLowerCase() },
        ],
        status: { in: ["ACTIVE", "ABANDONED", "RECOVERED"] },
      },
      include: {
        items: {
          include: {
            product: {
              include: { variants: true },
            },
          },
        },
      },
      orderBy: { lastActiveAt: "desc" },
    });

    const cartItems =
      cartSession?.items && cartSession.items.length > 0
        ? cartSession.items
        : await prisma.cartItem.findMany({
            where: {
              ...(sessionOrUserId ? { sessionOrUserId } : {}),
            },
            include: {
              product: {
                include: { variants: true },
              },
            },
          });

    if (cartItems.length === 0) {
      return NextResponse.json({ success: false, error: "Your cart is empty" }, { status: 400 });
    }

    // Validate that items in the cart are active and in stock before allowing order placement
    for (const item of cartItems) {
      if (!item.product.isActive || item.product.stock <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `"${item.product.name}" is currently out of stock. Please remove it from your cart to proceed.`,
          },
          { status: 400 }
        );
      }
    }

    const getItemPrice = (item: (typeof cartItems)[0]) => {
      const productWithVariants = item.product as typeof item.product & {
        variants?: Array<{ id: string; name: string; priceModifier?: number | null }>;
      };
      const variant = productWithVariants.variants?.find(
        (v) => v.id === item.variantId || v.name === item.variantName
      );
      const modifier = variant ? Number(variant.priceModifier || 0) : 0;
      return Number(item.product.price) + modifier;
    };

    const subtotal = cartItems.reduce(
      (acc, item) => acc + getItemPrice(item) * item.quantity,
      0
    );

    const totalWatchesCount = cartItems.reduce(
      (acc, item) => acc + item.quantity,
      0
    );

    const rawEngravingText = parsed.shippingAddress.engravingText?.trim() || "";
    const engravingLines = rawEngravingText
      ? rawEngravingText.split("\n").map((line) => line.trim()).filter((line) => line.length > 0)
      : [];

    const validatedEngravedCount =
      engravingLines.length > 0
        ? Math.min(totalWatchesCount, Math.max(1, engravingLines.length))
        : 0;

    const validatedEngravingFee = validatedEngravedCount * 200;

    const validatedDiscountAmount =
      validatedEngravingFee === 0 && payFullUpfrontForDiscount
        ? Math.round(subtotal * 0.05)
        : 0;

    const total = subtotal + deliveryFee + validatedEngravingFee - validatedDiscountAmount;

    const isFullPrepayment =
      validatedEngravingFee > 0 || (payFullUpfrontForDiscount && validatedDiscountAmount > 0);
    const amountDueNow = isFullPrepayment ? total : deliveryFee;
    const amountDueOnDelivery = isFullPrepayment ? 0 : subtotal;

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId: cartSession?.userId || null,
          guestEmail: parsed.shippingAddress.email.trim().toLowerCase(),
          status: "PENDING",
          subtotal,
          discountAmount: validatedDiscountAmount,
          deliveryFee,
          engravingFee: validatedEngravingFee,
          total,
          amountDueNow,
          amountDueOnDelivery,
          shippingAddress: JSON.parse(
            JSON.stringify({
              ...parsed.shippingAddress,
              engravingFee: validatedEngravingFee,
            })
          ),
          deliveryMethod,
          county: county ?? null,
          paymentMethod,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtPurchase: getItemPrice(item),
              variantId: item.variantId || null,
              variantName: item.variantName || null,
            })),
          },
        },
      });

      if (cartSession) {
        const isRecovered = cartSession.reminderCount > 0;
        await tx.cartSession.update({
          where: { id: cartSession.id },
          data: {
            orderId: createdOrder.id,
            status: isRecovered ? "RECOVERED" : "CONVERTED",
            lastActiveAt: new Date(),
          },
        });
      }

      const cartCleanupFilters = [
        ...(sessionOrUserId ? [{ sessionOrUserId }] : []),
        ...(cartSession ? [{ cartSessionId: cartSession.id }] : []),
      ];

      if (cartCleanupFilters.length > 0) {
        await tx.cartItem.deleteMany({
          where: {
            OR: cartCleanupFilters,
          },
        });
      }

      return createdOrder;
    });

    // Note: Checkout uses an M-Pesa till number where payment is completed off-site.
    // This event represents "checkout completed" at order creation rather than confirmed payment receipt.
    const userAgent = req.headers.get("user-agent");
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");

    // Meta Conversions API (CAPI)
    captureCustomerLeadAsync({
      name: parsed.shippingAddress.fullName,
      email: parsed.shippingAddress.email,
      phone: parsed.phoneNumber || parsed.shippingAddress.phoneNumber,
      source: CrmSource.CHECKOUT,
      tags: ["Customer", "Order"],
    }).catch(() => {});

    sendCapiEvent({
      eventName: "Purchase",
      eventId: order.id,
      eventSourceUrl: `${siteUrl}/checkout`,
      userData: {
        email: parsed.shippingAddress.email,
        phone: parsed.phoneNumber || parsed.shippingAddress.phoneNumber,
        clientIp,
        userAgent,
        fbp,
        fbc,
      },
      customData: {
        value: total,
        currency: "KES",
        content_ids: cartItems.map((it) => it.productId),
        content_type: "product",
        num_items: totalWatchesCount,
        order_id: order.id,
      },
    }).catch(() => {});

    // TikTok Events API (Server-Side)
    sendTikTokEvent({
      eventName: "PlaceAnOrder",
      eventId: order.id,
      eventSourceUrl: `${siteUrl}/checkout`,
      userData: {
        email: parsed.shippingAddress.email,
        phone: parsed.phoneNumber || parsed.shippingAddress.phoneNumber,
        clientIp,
        userAgent,
        ttp,
      },
      properties: {
        contents: cartItems.map((it) => ({
          content_id: it.productId,
          content_name: it.product.name,
          content_type: "product",
          quantity: it.quantity,
          price: getItemPrice(it),
        })),
        value: total,
        currency: "KES",
        order_id: order.id,
      },
    }).catch(() => {});

    // Confirmation to the customer + alert to the shop, after the response is sent
    after(async () => {
      try {
        const full = await prisma.order.findUnique({
          where: { id: order.id },
          include: { items: { include: { product: { select: { name: true, slug: true } } } } },
        });
        if (full) await sendNewOrderEmails(toEmailOrder(full));
      } catch (err) {
        console.error("[checkout] order emails failed", err);
      }
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderNumberDisplay: displayOrderNumber(order),
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0]?.message || "Invalid checkout details";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Checkout processing failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
