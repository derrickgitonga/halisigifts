import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { processNextCampaignBatch } from "@/lib/crm-dispatcher";
import {
  generateWhatsAppBroadcastCsv,
  formatWhatsAppCampaignMessage,
  buildWhatsAppDirectUrl,
} from "@/lib/whatsapp-marketing";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const campaigns = await prisma.crmCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      _count: {
        select: { logs: true },
      },
    },
  });

  return NextResponse.json({ success: true, campaigns });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const { title, channel, subject, message, productIds } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Campaign message cannot be empty" }, { status: 400 });
    }

    const campaignChannel = channel === "WHATSAPP" ? "WHATSAPP" : "EMAIL";

    if (campaignChannel === "EMAIL" && (!subject || typeof subject !== "string" || subject.trim().length === 0)) {
      return NextResponse.json({ error: "Email subject is required" }, { status: 400 });
    }

    const validProductIds = Array.isArray(productIds) ? productIds : [];

    if (campaignChannel === "EMAIL") {
      const totalEligible = await prisma.crmContact.count({
        where: {
          isSubscribedEmail: true,
          email: { not: null },
        },
      });

      const campaign = await prisma.crmCampaign.create({
        data: {
          title: title?.trim() || `Email Campaign - ${new Date().toLocaleDateString()}`,
          channel: "EMAIL",
          subject: subject.trim(),
          message: message.trim(),
          productIds: validProductIds,
          batchSize: 50,
          recipientCount: totalEligible,
          status: "PROCESSING",
        },
      });

      const batchResult = await processNextCampaignBatch(campaign.id);

      return NextResponse.json({
        success: true,
        campaignId: campaign.id,
        summary: {
          totalEligible,
          batch1Sent: batchResult.dispatchedCount || 0,
          completed: batchResult.completed || false,
          nextBatchAt: batchResult.nextBatchAt || null,
        },
      });
    }

    const campaign = await prisma.crmCampaign.create({
      data: {
        title: title?.trim() || `WhatsApp Campaign - ${new Date().toLocaleDateString()}`,
        channel: "WHATSAPP",
        subject: null,
        message: message.trim(),
        productIds: validProductIds,
        status: "PROCESSING",
      },
    });

    const dbProducts = validProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: validProductIds } },
          select: { id: true, name: true, slug: true, price: true, images: true },
        })
      : [];

    const attachedProducts = dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      images: p.images,
    }));

    const whatsappContacts = await prisma.crmContact.findMany({
      where: {
        isSubscribedWhatsapp: true,
        phone: { not: null },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        normalizedPhone: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const activeList = whatsappContacts
      .filter((c) => Boolean(c.normalizedPhone || c.phone))
      .map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.normalizedPhone || c.phone || "",
      }));

    const csvData = generateWhatsAppBroadcastCsv({
      contacts: activeList,
      message: message.trim(),
      products: attachedProducts,
    });

    const previewList = activeList.slice(0, 50).map((c) => {
      const text = formatWhatsAppCampaignMessage({
        customerName: c.name,
        message: message.trim(),
        products: attachedProducts,
      });
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        url: buildWhatsAppDirectUrl(c.phone, text),
        text,
      };
    });

    await prisma.crmCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "COMPLETED",
        recipientCount: activeList.length,
        sentCount: activeList.length,
        completedAt: new Date(),
      },
    });

    for (const c of activeList) {
      await prisma.crmContact.update({
        where: { id: c.id },
        data: {
          marketingWhatsappSent: { increment: 1 },
          lastContactedAt: new Date(),
        },
      });

      await prisma.crmCampaignLog.create({
        data: {
          campaignId: campaign.id,
          contactId: c.id,
          channel: "WHATSAPP",
          status: "DELIVERED",
        },
      });
    }

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      recipientCount: activeList.length,
      csvData,
      previewList,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Campaign processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
