import { NextRequest, NextResponse } from "next/server";
import { processAbandonedCarts } from "@/lib/cron/abandoned-carts";

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret") || req.nextUrl.searchParams.get("key");

  if (cronSecret) {
    if (authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret) {
      return true;
    }
    return false;
  }

  const host = req.headers.get("host") || "";
  if (
    process.env.NODE_ENV === "development" ||
    host.includes("localhost") ||
    host.includes("127.0.0.1")
  ) {
    return true;
  }

  return false;
}

async function handleCronExecution(req: NextRequest) {
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
