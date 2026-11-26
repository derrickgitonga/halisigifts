import { NextRequest, NextResponse } from "next/server";
import { processNextCampaignBatch } from "@/lib/crm-dispatcher";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");

  const isAuthorized =
    Boolean(cronSecret) &&
    (authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret);

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
