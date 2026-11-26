import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { buildMarketingEmailHtml, type AttachedProduct } from "@/lib/email-marketing";

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

const FROM_EMAIL =
  process.env.FROM_EMAIL ||
  "Halisi Gifts <orders@halisigifts.com>";

export interface ProcessBatchResult {
  processed: boolean;
  campaignId?: string;
  dispatchedCount?: number;
  nextBatchAt?: Date | null;
  completed?: boolean;
  reason?: string;
  error?: string;
}

export async function processNextCampaignBatch(
  campaignId?: string
): Promise<ProcessBatchResult> {
  const campaign = campaignId
    ? await prisma.crmCampaign.findFirst({
        where: { id: campaignId, status: "PROCESSING" },
        include: { logs: { select: { contactId: true } } },
      })
    : await prisma.crmCampaign.findFirst({
        where: {
          status: "PROCESSING",
          channel: "EMAIL",
          OR: [{ nextBatchAt: null }, { nextBatchAt: { lte: new Date() } }],
        },
        orderBy: { createdAt: "asc" },
        include: { logs: { select: { contactId: true } } },
      });

  if (!campaign) {
    return {
      processed: false,
      reason: "No campaigns currently ready for batch dispatch",
    };
  }

  const alreadySentContactIds = new Set(campaign.logs.map((log) => log.contactId));
  const batchLimit = campaign.batchSize || 50;

  const candidateContacts = await prisma.crmContact.findMany({
    where: {
      isSubscribedEmail: true,
      email: { not: null },
      id: { notIn: Array.from(alreadySentContactIds) },
    },
    take: batchLimit,
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      unsubscribeToken: true,
    },
  });

  const validBatch = candidateContacts.filter(
    (c): c is typeof c & { email: string } => Boolean(c.email && c.email.includes("@"))
  );

  if (validBatch.length === 0) {
    await prisma.crmCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        nextBatchAt: null,
      },
    });

    return {
      processed: true,
      campaignId: campaign.id,
      completed: true,
      dispatchedCount: 0,
      nextBatchAt: null,
    };
  }

  const resend = getResendClient();
  if (!resend) {
    return {
      processed: true,
      campaignId: campaign.id,
      error: "Resend API key is not configured",
    };
  }

  const attachedProducts: AttachedProduct[] = [];
  if (campaign.productIds.length > 0) {
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: campaign.productIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
      },
    });

    for (const p of dbProducts) {
      attachedProducts.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        images: p.images,
      });
    }
  }

  const emailPayloads = validBatch.map((recipient) => {
    const html = buildMarketingEmailHtml({
      customerName: recipient.name,
      rawMessage: campaign.message,
      products: attachedProducts,
      unsubscribeToken: recipient.unsubscribeToken,
    });

    return {
      from: FROM_EMAIL,
      to: recipient.email,
      subject: campaign.subject || "Halisi Gifts Shop Collection",
      html,
    };
  });

  try {
    const batchResponse = await resend.batch.send(emailPayloads);

    if (batchResponse.error) {
      await prisma.crmCampaignLog.createMany({
        data: validBatch.map((r) => ({
          campaignId: campaign.id,
          contactId: r.id,
          channel: "EMAIL",
          status: "FAILED",
          error: batchResponse.error?.message || "Batch send error",
        })),
      });

      await prisma.crmCampaign.update({
        where: { id: campaign.id },
        data: {
          failedCount: { increment: validBatch.length },
          nextBatchAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      return {
        processed: true,
        campaignId: campaign.id,
        error: batchResponse.error.message,
      };
    }

    const nextBatchDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (tx: any) => {
      await tx.crmCampaignLog.createMany({
        data: validBatch.map((r) => ({
          campaignId: campaign.id,
          contactId: r.id,
          channel: "EMAIL",
          status: "DELIVERED",
        })),
      });

      await tx.crmContact.updateMany({
        where: { id: { in: validBatch.map((r) => r.id) } },
        data: {
          marketingEmailsSent: { increment: 1 },
          lastContactedAt: new Date(),
        },
      });

      const remainingCount = await tx.crmContact.count({
        where: {
          isSubscribedEmail: true,
          email: { not: null },
          id: {
            notIn: [
              ...Array.from(alreadySentContactIds),
              ...validBatch.map((r) => r.id),
            ],
          },
        },
      });

      if (remainingCount === 0) {
        await tx.crmCampaign.update({
          where: { id: campaign.id },
          data: {
            sentCount: { increment: validBatch.length },
            status: "COMPLETED",
            completedAt: new Date(),
            nextBatchAt: null,
          },
        });
      } else {
        await tx.crmCampaign.update({
          where: { id: campaign.id },
          data: {
            sentCount: { increment: validBatch.length },
            nextBatchAt: nextBatchDate,
          },
        });
      }
    });

    return {
      processed: true,
      campaignId: campaign.id,
      dispatchedCount: validBatch.length,
      nextBatchAt: nextBatchDate,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Dispatch execution failed";
    console.error("[CRM Dispatcher Error]:", message);

    await prisma.crmCampaign.update({
      where: { id: campaign.id },
      data: {
        failedCount: { increment: validBatch.length },
        nextBatchAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    return {
      processed: true,
      campaignId: campaign.id,
      error: message,
    };
  }
}
