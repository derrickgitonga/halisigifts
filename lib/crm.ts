import { prisma } from "@/lib/prisma";
import { CrmSource } from "@prisma/client";

export function normalizeKenyanPhone(input?: string | null): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  if ((digits.startsWith("07") || digits.startsWith("01")) && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }

  if (digits.startsWith("254") && digits.length === 12) {
    return digits;
  }

  if ((digits.startsWith("7") || digits.startsWith("1")) && digits.length === 9) {
    return `254${digits}`;
  }

  if (digits.length >= 9 && digits.length <= 15) {
    return digits;
  }

  return null;
}

export function formatCustomerFirstName(fullName?: string | null, fallback = "Valued Customer"): string {
  if (!fullName) return fallback;
  const clean = fullName.trim().replace(/\s+/g, " ");
  if (!clean || clean.toLowerCase() === "customer") return fallback;
  const firstWord = clean.split(" ")[0];
  if (!firstWord || firstWord.length < 2) return fallback;
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}

export interface CaptureCustomerLeadParams {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: CrmSource;
  tags?: string[];
  notes?: string | null;
}

export async function captureCustomerLeadAsync(
  params: CaptureCustomerLeadParams
): Promise<void> {
  try {
    const rawEmail = params.email?.trim().toLowerCase() || null;
    const email = rawEmail && rawEmail.includes("@") && rawEmail.includes(".") ? rawEmail : null;
    const normalizedPhone = normalizeKenyanPhone(params.phone);
    const rawPhone = params.phone?.trim() || null;
    const phone = normalizedPhone ? (rawPhone || normalizedPhone) : null;
    const rawName = params.name?.trim();
    const name = rawName && rawName.length > 0 ? rawName : "Customer";
    const source = params.source || CrmSource.CHECKOUT;
    const incomingTags = Array.isArray(params.tags) ? params.tags : [];

    if (!email && !normalizedPhone) {
      return;
    }

    const executeUpsert = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await prisma.$transaction(async (tx: any) => {
        const orClauses: Array<{ email?: string; normalizedPhone?: string }> = [
          ...(email ? [{ email }] : []),
          ...(normalizedPhone ? [{ normalizedPhone }] : []),
        ];

        const existing = await tx.crmContact.findFirst({
          where: { OR: orClauses },
        });

        if (existing) {
          let canUpdateEmail = false;
          if (email && existing.email !== email) {
            const emailOwner = await tx.crmContact.findUnique({ where: { email } });
            if (!emailOwner) canUpdateEmail = true;
          }

          let canUpdatePhone = false;
          if (normalizedPhone && existing.normalizedPhone !== normalizedPhone) {
            const phoneOwner = await tx.crmContact.findUnique({
              where: { normalizedPhone },
            });
            if (!phoneOwner) canUpdatePhone = true;
          }

          const mergedTags = Array.from(new Set([...(existing.tags || []), ...incomingTags]));
          const updatedName =
            (existing.name === "Customer" || !existing.name) && name !== "Customer"
              ? name
              : existing.name;

          let updatedNotes = existing.notes;
          if (params.notes?.trim()) {
            updatedNotes = existing.notes
              ? `${existing.notes}\n${params.notes.trim()}`
              : params.notes.trim();
          }

          await tx.crmContact.update({
            where: { id: existing.id },
            data: {
              name: updatedName,
              ...(canUpdateEmail ? { email } : {}),
              ...(canUpdatePhone ? { phone, normalizedPhone } : {}),
              tags: mergedTags,
              notes: updatedNotes,
              updatedAt: new Date(),
            },
          });
        } else {
          await tx.crmContact.create({
            data: {
              name,
              email,
              phone,
              normalizedPhone,
              source,
              tags: incomingTags,
              notes: params.notes?.trim() || null,
            },
          });
        }
      });
    };

    try {
      await executeUpsert();
    } catch (txErr: unknown) {
      if (
        txErr &&
        typeof txErr === "object" &&
        "code" in txErr &&
        txErr.code === "P2002"
      ) {
        await executeUpsert();
      } else {
        throw txErr;
      }
    }
  } catch (error) {
    console.error("[CRM Lead Capture Error]:", error);
  }
}

export interface HistoricalSyncResult {
  ordersProcessed: number;
  cartsProcessed: number;
  usersProcessed: number;
  totalSynced: number;
  errors: number;
}

export async function syncHistoricalCustomers(): Promise<HistoricalSyncResult> {
  const result: HistoricalSyncResult = {
    ordersProcessed: 0,
    cartsProcessed: 0,
    usersProcessed: 0,
    totalSynced: 0,
    errors: 0,
  };

  try {
    let orderCursor: string | undefined = undefined;
    while (true) {
      const orders: Array<{
        id: string;
        guestEmail: string | null;
        shippingAddress: unknown;
      }> = await prisma.order.findMany({
        take: 100,
        skip: orderCursor ? 1 : 0,
        cursor: orderCursor ? { id: orderCursor } : undefined,
        orderBy: { id: "asc" },
        select: {
          id: true,
          guestEmail: true,
          shippingAddress: true,
        },
      });

      if (orders.length === 0) break;
      orderCursor = orders[orders.length - 1].id;

      for (const order of orders) {
        result.ordersProcessed += 1;
        const address = (order.shippingAddress as {
          fullName?: string;
          email?: string;
          phoneNumber?: string;
        } | null) || {};

        const email = address.email || order.guestEmail;
        const phone = address.phoneNumber;
        const name = address.fullName;

        if (email || phone) {
          try {
            await captureCustomerLeadAsync({
              name,
              email,
              phone,
              source: CrmSource.HISTORICAL_SYNC,
              tags: ["Customer", "Order"],
            });
            result.totalSynced += 1;
          } catch {
            result.errors += 1;
          }
        }
      }
    }

    let cartCursor: string | undefined = undefined;
    while (true) {
      const carts: Array<{
        id: string;
        email: string | null;
        customerName: string | null;
      }> = await prisma.cartSession.findMany({
        take: 100,
        skip: cartCursor ? 1 : 0,
        cursor: cartCursor ? { id: cartCursor } : undefined,
        orderBy: { id: "asc" },
        where: { email: { not: null } },
        select: {
          id: true,
          email: true,
          customerName: true,
        },
      });

      if (carts.length === 0) break;
      cartCursor = carts[carts.length - 1].id;

      for (const cart of carts) {
        result.cartsProcessed += 1;
        if (cart.email) {
          try {
            await captureCustomerLeadAsync({
              name: cart.customerName,
              email: cart.email,
              source: CrmSource.CART,
              tags: ["Cart Visitor"],
            });
            result.totalSynced += 1;
          } catch {
            result.errors += 1;
          }
        }
      }
    }

    let userCursor: string | undefined = undefined;
    while (true) {
      const users: Array<{
        id: string;
        email: string;
        name: string | null;
      }> = await prisma.user.findMany({
        take: 100,
        skip: userCursor ? 1 : 0,
        cursor: userCursor ? { id: userCursor } : undefined,
        orderBy: { id: "asc" },
        where: { role: "CUSTOMER" },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      if (users.length === 0) break;
      userCursor = users[users.length - 1].id;

      for (const user of users) {
        result.usersProcessed += 1;
        try {
          await captureCustomerLeadAsync({
            name: user.name,
            email: user.email,
            source: CrmSource.HISTORICAL_SYNC,
            tags: ["Registered Account"],
          });
          result.totalSynced += 1;
        } catch {
          result.errors += 1;
        }
      }
    }
  } catch (error) {
    console.error("[CRM Historical Sync Error]:", error);
    result.errors += 1;
  }

  return result;
}
