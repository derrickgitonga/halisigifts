import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { Prisma, OrderStatus } from "@prisma/client";
import { buildWhatsAppOrderMessage, WhatsAppOrderData } from "@/lib/whatsapp-order";
import { displayOrderNumber, parseOrderNumber } from "@/lib/order-tracking";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (status !== "all" && Object.values(OrderStatus).includes(status as OrderStatus)) {
      where.status = status as OrderStatus;
    }

    if (search) {
      const searchedNumber = parseOrderNumber(search);
      where.OR = [
        ...(searchedNumber !== null ? [{ orderNumber: searchedNumber }] : []),
        { id: { contains: search, mode: "insensitive" } },
        { guestEmail: { contains: search, mode: "insensitive" } },
        { county: { contains: search, mode: "insensitive" } },
        { paymentReference: { contains: search, mode: "insensitive" } },
      ];
    }

    const [
      orders,
      totalCount,
      pendingCount,
      processingCount,
      paidCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
      allCompletedOrders,
    ] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                  sku: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "PROCESSING" } }),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.order.count({ where: { status: "SHIPPED" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.count({ where: { status: "CANCELLED" } }),
      prisma.order.findMany({
        where: { status: { not: "CANCELLED" } },
        select: { total: true },
      }),
    ]);

    const totalRevenue = allCompletedOrders.reduce(
      (acc, o) => acc + Number(o.total || 0),
      0
    );

    const formattedOrders = orders.map((order) => {
      const shippingAddress = (order.shippingAddress as {
        fullName?: string;
        email?: string;
        phoneNumber?: string;
        addressLine?: string;
        county?: string;
        engravingText?: string;
        engravingFee?: number;
        customerNote?: string;
        mpesaTransactionCode?: string;
      }) || {};

      const subtotal = Number(order.subtotal);
      const deliveryFee = order.deliveryFee;
      const engravingFee = order.engravingFee;
      const discountAmount = Number(order.discountAmount || 0);
      const total = Number(order.total);
      const amountDueNow = Number(order.amountDueNow);
      const amountDueOnDelivery = Number(order.amountDueOnDelivery);

      const whatsAppPayload: WhatsAppOrderData = {
        orderId: order.id,
        orderNumber: displayOrderNumber(order),
        fullName: shippingAddress.fullName || "Customer",
        phoneNumber: shippingAddress.phoneNumber || "",
        email: shippingAddress.email || order.guestEmail || "",
        fulfillment: order.deliveryMethod === "PICKUP" ? "PICKUP" : "DELIVERY",
        county: shippingAddress.county || order.county,
        addressLine: shippingAddress.addressLine,
        items: order.items.map((item) => ({
          name: item.product?.name || "Product",
          slug: item.product?.slug || "",
          variantName: item.variantName || undefined,
          quantity: item.quantity,
          price: Number(item.priceAtPurchase),
        })),
        subtotal,
        deliveryFee,
        engravingText: shippingAddress.engravingText,
        engravingFee,
        discountAmount,
        total,
        amountDueNow,
        amountDueOnDelivery,
        paymentMethod: order.paymentMethod,
        mpesaTransactionCode: shippingAddress.mpesaTransactionCode,
        customerNote: shippingAddress.customerNote,
      };

      const whatsAppMessage = buildWhatsAppOrderMessage(whatsAppPayload);

      return {
        ...order,
        subtotal,
        total,
        discountAmount,
        amountDueNow,
        amountDueOnDelivery,
        shippingAddress,
        items: order.items.map((item) => ({
          ...item,
          priceAtPurchase: Number(item.priceAtPurchase),
        })),
        orderNumberDisplay: displayOrderNumber(order),
        whatsAppMessage,
        whatsAppPayload,
      };
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      stats: {
        totalOrders: totalCount,
        pending: pendingCount,
        processing: processingCount,
        paid: paidCount,
        shipped: shippedCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
        totalRevenue,
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load orders" },
      { status: 500 }
    );
  }
}
