import { NextRequest, NextResponse } from "next/server";
import { getCartRecommendations } from "@/lib/recommendations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids") || "";
    const cartProductIds = idsParam ? idsParam.split(",").map((id) => id.trim()).filter(Boolean) : [];
    const limit = parseInt(searchParams.get("limit") || "4", 10);

    const recommendations = await getCartRecommendations(cartProductIds, limit);

    return NextResponse.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to get cart recommendations" },
      { status: 500 }
    );
  }
}
