import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { syncHistoricalCustomers } from "@/lib/crm";

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const result = await syncHistoricalCustomers();
    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
