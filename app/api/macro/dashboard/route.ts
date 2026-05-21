import { NextResponse } from "next/server";
import { getSnapshot } from "@/lib/macro";
import { analyzeDashboard } from "@/lib/claude";

export const dynamic = "force-dynamic";

/**
 * GET /api/macro/dashboard — x402-gated ($0.30).
 * Returns all four macro panels plus a Claude-generated overall analysis.
 */
export async function GET() {
  const snapshot = await getSnapshot();
  const analysis = await analyzeDashboard(snapshot);

  return NextResponse.json({
    updatedAt: snapshot.updatedAt,
    overallScore: snapshot.overallScore,
    regime: snapshot.regime,
    dataMode: snapshot.dataMode,
    panels: snapshot.panels,
    analysis,
  });
}
