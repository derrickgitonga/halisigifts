import { NextRequest, NextResponse } from "next/server";
import { getCartRecommendations } from "@/lib/recommendations";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(`cart-recs:${getClientIp(request)}`, { limit: 60, windowMs: 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids") || "";
    const cartProductIds = idsParam
      ? idsParam.split(",").map((id) => id.trim()).filter(Boolean).slice(0, 20)
      : [];
    const parsedLimit = parseInt(searchParams.get("limit") || "4", 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(12, Math.max(1, parsedLimit)) : 4;

    const recommendations = await getCartRecommendations(cartProductIds, limit);

    return NextResponse.json({
      success: true,
      recommendations,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to get cart recommendations" },
      { status: 500 }
    );
  }
}
