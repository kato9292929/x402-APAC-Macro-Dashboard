import { NextResponse } from "next/server";
import { getSnapshot } from "@/lib/macro";
import { generateWeeklyReport } from "@/lib/claude";

export const dynamic = "force-dynamic";

/**
 * GET /api/macro/weekly — x402-gated ($3.00).
 * Returns the weekly APAC macro intelligence report (~3,000 characters).
 */
export async function GET() {
  const snapshot = await getSnapshot();
  const report = await generateWeeklyReport(snapshot);

  return NextResponse.json({
    updatedAt: snapshot.updatedAt,
    period: "weekly",
    overallScore: snapshot.overallScore,
    regime: snapshot.regime,
    dataMode: snapshot.dataMode,
    report,
  });
}
