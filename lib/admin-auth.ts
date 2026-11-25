import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Route-level admin guard (defence in depth: proxy.ts also blocks these paths).
 * Usage at the top of every admin API handler:
 *
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
  }
  return null;
}
