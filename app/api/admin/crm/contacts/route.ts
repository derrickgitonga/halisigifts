import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { captureCustomerLeadAsync } from "@/lib/crm";
import { CrmSource, type Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.trim() || "";
  const channel = searchParams.get("channel");
  const source = searchParams.get("source");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "25", 10)));
  const skip = (page - 1) * limit;

  const where: Prisma.CrmContactWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { normalizedPhone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (channel === "email") {
    where.isSubscribedEmail = true;
    where.email = { not: null };
  } else if (channel === "whatsapp") {
    where.isSubscribedWhatsapp = true;
    where.phone = { not: null };
  }

  if (source && Object.values(CrmSource).includes(source as CrmSource)) {
    where.source = source as CrmSource;
  }

  const [total, contacts] = await Promise.all([
    prisma.crmContact.count({ where }),
    prisma.crmContact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        normalizedPhone: true,
        source: true,
        tags: true,
        notes: true,
        marketingEmailsSent: true,
        marketingWhatsappSent: true,
        isSubscribedEmail: true,
        isSubscribedWhatsapp: true,
        lastContactedAt: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    contacts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const { name, email, phone, tags, notes } = body;

    if (!email && !phone) {
      return NextResponse.json(
        { error: "At least an email address or a phone number is required" },
        { status: 400 }
      );
    }

    await captureCustomerLeadAsync({
      name: typeof name === "string" ? name : "Customer",
      email: typeof email === "string" ? email : null,
      phone: typeof phone === "string" ? phone : null,
      source: CrmSource.MANUAL,
      tags: Array.isArray(tags) ? tags : ["Direct Addition"],
      notes: typeof notes === "string" ? notes : null,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create contact";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
