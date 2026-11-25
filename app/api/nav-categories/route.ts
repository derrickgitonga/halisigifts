import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { showInNav: true },
      orderBy: [{ navOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, navLabel: true },
    });
    return NextResponse.json({ success: true, categories });
  } catch {
    return NextResponse.json(
      { success: false, categories: [] },
      { status: 500 }
    );
  }
}
