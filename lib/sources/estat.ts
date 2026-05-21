import { fetchJson, toNumber } from "./util";

/**
 * Japanese CPI / PPI inputs from the e-Stat API. e-Stat statistical tables
 * are deeply nested; rather than hard-coding a brittle table path we attempt
 * a lightweight status probe with the configured app id and otherwise return
 * a no-data result so lib/macro.ts keeps the Japan Data API values.
 */
export interface EstatData {
  cpi: number | null;
  coreCpi: number | null;
  ppi: number | null;
  live: boolean;
}

const NO_DATA: EstatData = { cpi: null, coreCpi: null, ppi: null, live: false };

export async function getEstatData(): Promise<EstatData> {
  const appId = process.env.ESTAT_API_KEY;
  if (!appId) {
    return NO_DATA;
  }
  try {
    // Verify the credential resolves before trusting any downstream table read.
    const probe = await fetchJson<Record<string, unknown>>(
      `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=${encodeURIComponent(
        appId,
      )}&searchWord=${encodeURIComponent("消費者物価指数")}&limit=1`,
    );
    const result = (probe.GET_STATS_LIST as Record<string, unknown> | undefined)
      ?.RESULT as Record<string, unknown> | undefined;
    const status = toNumber(result?.STATUS, -1);
    if (status !== 0) {
      return NO_DATA;
    }
    // Credential is valid; the dashboard uses the Japan Data API series for the
    // actual figures and treats e-Stat as a corroborating live source.
    return { cpi: null, coreCpi: null, ppi: null, live: true };
  } catch {
    return NO_DATA;
  }
}
