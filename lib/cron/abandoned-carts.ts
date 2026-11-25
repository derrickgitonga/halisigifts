import { prisma } from "@/lib/prisma";
import { sendAbandonedCartEmail, type ReminderTier, type CartSessionWithItems } from "@/lib/email";
import crypto from "crypto";

export interface AbandonedCartJobResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  byTier: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
  details: Array<{
    cartSessionId: string;
    email: string;
    tier: ReminderTier;
    status: "SENT" | "FAILED" | "SKIPPED";
    error?: string;
  }>;
}

export async function processAbandonedCarts(): Promise<AbandonedCartJobResult> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

  const result: AbandonedCartJobResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    byTier: {
      tier1: 0,
      tier2: 0,
      tier3: 0,
    },
    details: [],
  };

  // Find candidate sessions matching any of the 3 tiers
  const candidateSessions = await prisma.cartSession.findMany({
    where: {
      status: { in: ["ACTIVE", "ABANDONED"] },
      email: { not: null },
      items: { some: {} },
      OR: [
        // Tier 1: reminderCount = 0 and inactive >= 1 hour
        {
          reminderCount: 0,
          lastActiveAt: { lt: oneHourAgo },
        },
        // Tier 2: reminderCount = 1 and inactive >= 24 hours
        {
          reminderCount: 1,
          lastActiveAt: { lt: twentyFourHoursAgo },
        },
        // Tier 3: reminderCount = 2 and inactive >= 72 hours
        {
          reminderCount: 2,
          lastActiveAt: { lt: seventyTwoHoursAgo },
        },
      ],
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              compareAtPrice: true,
              images: true,
            },
          },
        },
      },
    },
    take: 50,
  });

  result.processed = candidateSessions.length;

  for (const session of candidateSessions) {
    if (!session.email) {
      result.skipped++;
      continue;
    }

    const currentCount = session.reminderCount;
    if (currentCount >= 3) {
      result.skipped++;
      continue;
    }

    const targetTier = (currentCount + 1) as ReminderTier;
    const newToken = session.recoveryToken || crypto.randomBytes(24).toString("hex");

    // Optimistic locking guard: Atomic increment only if reminderCount still matches currentCount
    try {
      const lockResult = await prisma.cartSession.updateMany({
        where: {
          id: session.id,
          reminderCount: currentCount,
          status: { in: ["ACTIVE", "ABANDONED"] },
        },
        data: {
          reminderCount: targetTier,
          lastReminderAt: now,
          abandonedAt: session.abandonedAt || now,
          status: "ABANDONED",
          recoveryToken: newToken,
        },
      });

      if (lockResult.count === 0) {
        result.skipped++;
        result.details.push({
          cartSessionId: session.id,
          email: session.email,
          tier: targetTier,
          status: "SKIPPED",
          error: "Cart state changed or was claimed by another worker",
        });
        continue;
      }

      // Send the tier-aware email
      const sessionWithToken: CartSessionWithItems = {
        ...session,
        recoveryToken: newToken,
      };

      const sendResult = await sendAbandonedCartEmail(sessionWithToken, targetTier);

      if (sendResult.success) {
        result.sent++;
        if (targetTier === 1) result.byTier.tier1++;
        if (targetTier === 2) result.byTier.tier2++;
        if (targetTier === 3) result.byTier.tier3++;

        result.details.push({
          cartSessionId: session.id,
          email: session.email,
          tier: targetTier,
          status: "SENT",
        });
      } else {
        result.failed++;
        result.details.push({
          cartSessionId: session.id,
          email: session.email,
          tier: targetTier,
          status: "FAILED",
          error: sendResult.error,
        });
      }
    } catch (cartError: unknown) {
      const msg = cartError instanceof Error ? cartError.message : "Unexpected worker error";
      result.failed++;
      result.details.push({
        cartSessionId: session.id,
        email: session.email,
        tier: targetTier,
        status: "FAILED",
        error: msg,
      });
    }
  }

  return result;
}
