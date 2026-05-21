export type PanelKey = "rates" | "fx" | "realestate" | "inflation";

export type Regime = "RISK_ON" | "RISK_NEUTRAL" | "RISK_OFF";

export type DataMode = "live" | "partial" | "fallback";

export interface ScoreMetric {
  label: string;
  value: string;
  score: number;
}

export interface DataPoint {
  label: string;
  value: string;
}

export interface PanelSummary {
  score: number;
  trend: string;
  keyMetric: string;
}

export interface PanelData {
  key: PanelKey;
  title: string;
  titleJa: string;
  score: number;
  trend: string;
  keyMetric: string;
  metrics: ScoreMetric[];
  dataPoints: DataPoint[];
  sources: string[];
  commentary: string;
  price: string;
}

export interface DashboardAnalysis {
  headline: string;
  topRisk: string;
  topOpportunity: string;
  onchainSignal: string;
  analysis_ja: string;
  confidence: number;
}

export interface MacroSnapshot {
  updatedAt: string;
  overallScore: number;
  regime: Regime;
  onchainSignal: string;
  dataMode: DataMode;
  panels: Record<PanelKey, PanelSummary>;
  panelDetails: Record<PanelKey, PanelData>;
}
