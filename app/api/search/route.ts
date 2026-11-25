import { NextRequest, NextResponse } from "next/server";
import { getSmartSearchResults } from "@/lib/recommendations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateLimit = checkRateLimit(`search:${clientIp}`, { limit: 60, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many search requests. Please try again in a moment." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const result = await getSmartSearchResults(q, limit);

    return NextResponse.json({
      success: true,
      query: result.query,
      exactMatches: result.exactMatches,
      fallbackMatches: result.fallbackMatches,
      isFallback: result.isFallback,
      total: result.total,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform search",
      },
      { status: 500 }
    );
  }
}
