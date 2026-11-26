import { NextRequest, NextResponse } from "next/server";
import { processNextCampaignBatch } from "@/lib/crm-dispatcher";
import { checkRateLimit, getClientIp, safeCompareSecret } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(`cron-crm:${getClientIp(req)}`, { limit: 20, windowMs: 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const querySecret = req.nextUrl.searchParams.get("secret");

  const isAuthorized =
    Boolean(cronSecret) &&
    (safeCompareSecret(bearerToken, cronSecret) || safeCompareSecret(querySecret, cronSecret));

  if (!isAuthorized) {
    return NextResponse.json(
      { success: false, error: "Unauthorized access" },
      { status: 401 }
    );
  }

  try {
    const result = await processNextCampaignBatch();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Batch cron job failed";
    console.error("[CRON CRM Batch Error]:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
