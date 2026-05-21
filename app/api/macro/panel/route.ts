import { NextResponse } from "next/server";
import { getSnapshot, isPanelKey, PANEL_KEYS } from "@/lib/macro";

export const dynamic = "force-dynamic";

/**
 * POST /api/macro/panel — x402-gated ($0.20).
 * Body: { panel: "rates" | "fx" | "realestate" | "inflation" }
 * Returns the detailed data for a single macro panel.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const panel = (body as { panel?: unknown } | null)?.panel;
  if (!isPanelKey(panel)) {
    return NextResponse.json(
      {
        error: `Invalid "panel". Must be one of: ${PANEL_KEYS.join(", ")}`,
      },
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
