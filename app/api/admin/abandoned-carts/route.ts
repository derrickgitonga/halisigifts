import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { processAbandonedCarts } from "@/lib/cron/abandoned-carts";

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const summary = await processAbandonedCarts();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to run abandoned cart recovery";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
