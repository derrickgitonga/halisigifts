import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { sendOrderStatusEmail, toEmailOrder } from "@/lib/order-emails";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { buildWhatsAppOrderMessage, WhatsAppOrderData } from "@/lib/whatsapp-order";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const shippingAddress = (order.shippingAddress as any) || {};
    const subtotal = Number(order.subtotal);
    const total = Number(order.total);
    const discountAmount = Number(order.discountAmount || 0);
    const amountDueNow = Number(order.amountDueNow);
    const amountDueOnDelivery = Number(order.amountDueOnDelivery);

    const whatsAppPayload: WhatsAppOrderData = {
      orderId: order.id,
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
      deliveryFee: order.deliveryFee,
      engravingText: shippingAddress.engravingText,
      engravingFee: order.engravingFee,
      discountAmount,
      total,
      amountDueNow,
      amountDueOnDelivery,
      paymentMethod: order.paymentMethod,
      mpesaTransactionCode: shippingAddress.mpesaTransactionCode,
      customerNote: shippingAddress.customerNote,
    };

    return NextResponse.json({
      success: true,
      order: {
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
        whatsAppMessage: buildWhatsAppOrderMessage(whatsAppPayload),
        whatsAppPayload,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const dataToUpdate: any = {};

    if (body.status && Object.values(OrderStatus).includes(body.status)) {
      dataToUpdate.status = body.status as OrderStatus;
    }

    if (body.paymentReference !== undefined) {
      dataToUpdate.paymentReference = body.paymentReference;
    }

    if (body.shippingAddress !== undefined) {
      dataToUpdate.shippingAddress = body.shippingAddress;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: dataToUpdate,
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    const statusChanged = dataToUpdate.status && dataToUpdate.status !== existing.status;
    const notifyCustomer = body.notifyCustomer !== false; // admin can opt out per update
    if (statusChanged && notifyCustomer) {
      after(() => sendOrderStatusEmail(toEmailOrder(updated)));
    }

    return NextResponse.json({
      success: true,
      customerNotified: Boolean(statusChanged && notifyCustomer),
      order: {
        ...updated,
        subtotal: Number(updated.subtotal),
        total: Number(updated.total),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
