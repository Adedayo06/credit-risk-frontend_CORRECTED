// main.py classifies on two thresholds:
//   probability >= 0.35  -> "High risk of default"  -> Decline
//   probability >= 0.10  -> "Medium risk of default" -> Send for manual review
//   otherwise             -> "Low risk of default"    -> Approve
// This file mirrors that exactly so the UI never disagrees with the model.

export type RiskTier = "low" | "medium" | "high";

export function tierFromProbability(p: number): RiskTier {
  if (p >= 0.35) return "high";
  if (p >= 0.1) return "medium";
  return "low";
}

// Fallback for when only the backend's risk_band string is available.
export function tierFromBandString(band: string): RiskTier {
  const b = band.toLowerCase();
  if (b.includes("high")) return "high";
  if (b.includes("medium")) return "medium";
  return "low";
}

export const TIER_COLOR: Record<RiskTier, string> = {
  low: "var(--band-a)",
  medium: "var(--band-c)",
  high: "var(--band-e)",
};

export const TIER_LABEL: Record<RiskTier, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function recommendationClass(recommendation: string): string {
  const r = recommendation.toLowerCase();
  if (r.includes("approve")) return "rec-approve";
  if (r.includes("review")) return "rec-review";
  return "rec-decline";
}
