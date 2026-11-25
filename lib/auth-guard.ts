import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireAdminSession() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user || role !== "ADMIN") {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { success: false, error: "Unauthorized: Administrator access required" },
        { status: 401 }
      ),
      session: null,
    };
  }

  return {
    authorized: true as const,
    response: null,
    session,
  };
}
