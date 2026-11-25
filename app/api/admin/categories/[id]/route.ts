import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (typeof body.showInNav === "boolean") data.showInNav = body.showInNav;
    if (typeof body.navOrder === "number" && !Number.isNaN(body.navOrder)) {
      data.navOrder = Math.trunc(body.navOrder);
    }
    if (typeof body.navLabel === "string") {
      data.navLabel = body.navLabel.trim() || null;
    } else if (body.navLabel === null) {
      data.navLabel = null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, category });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update category" },
      { status: 500 }
    );
  }
}
