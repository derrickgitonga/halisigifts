import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        showInNav: true,
        navOrder: true,
        navLabel: true,
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ success: true, categories });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load categories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const name = (typeof body.name === "string" ? body.name : "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.category.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (existing) {
      return NextResponse.json({ success: true, category: existing });
    }

    let slug = generateSlug(name) || `category-${Date.now()}`;
    const slugConflict = await prisma.category.findUnique({ where: { slug } });
    if (slugConflict) {
      slug = `${slug}-${Date.now()}`;
    }

    const category = await prisma.category.create({
      data: { name, slug },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 }
    );
  }
}
