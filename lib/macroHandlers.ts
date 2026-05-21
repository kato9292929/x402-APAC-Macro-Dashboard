import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSnapshot, isPanelKey, PANEL_KEYS } from "./macro";
import { analyzeDashboard, generateWeeklyReport } from "./claude";

/**
 * Shared macro endpoint handlers, used by every chain-specific sub-route.
 * The original (Base) route.ts files keep their own inline handlers; these
 * mirror that logic so the Solana / Polygon / BNB sub-routes stay DRY without
 * modifying the existing files.
 */

export async function dashboardHandler(
  _req: NextRequest,
): Promise<NextResponse> {
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

export async function panelHandler(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const panel = (body as { panel?: unknown } | null)?.panel;
  if (!isPanelKey(panel)) {
    return NextResponse.json(
      { error: `Invalid "panel". Must be one of: ${PANEL_KEYS.join(", ")}` },
      { status: 400 },
    );
  }

  const snapshot = await getSnapshot();
  return NextResponse.json({
    updatedAt: snapshot.updatedAt,
    dataMode: snapshot.dataMode,
    panel: snapshot.panelDetails[panel],
  });
}

export async function weeklyHandler(_req: NextRequest): Promise<NextResponse> {
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
