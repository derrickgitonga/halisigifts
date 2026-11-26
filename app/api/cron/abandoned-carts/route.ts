import { NextRequest, NextResponse } from "next/server";
import { processAbandonedCarts } from "@/lib/cron/abandoned-carts";
import { checkRateLimit, getClientIp, safeCompareSecret } from "@/lib/rate-limit";

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const querySecret = req.nextUrl.searchParams.get("secret") || req.nextUrl.searchParams.get("key");

  if (cronSecret) {
    return safeCompareSecret(bearerToken, cronSecret) || safeCompareSecret(querySecret, cronSecret);
  }

  return process.env.NODE_ENV === "development";
}

async function handleCronExecution(req: NextRequest) {
  const rl = checkRateLimit(`cron-abandoned:${getClientIp(req)}`, { limit: 20, windowMs: 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }
  if (!isAuthorized(req)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Invalid or missing CRON_SECRET authorization",
      },
      { status: 401 }
    );
  }

  try {
    const result = await processAbandonedCarts();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal job execution failed";
    console.error("[CRON Error - Abandoned Carts]:", message);
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleCronExecution(req);
}

export async function POST(req: NextRequest) {
  return handleCronExecution(req);
}
