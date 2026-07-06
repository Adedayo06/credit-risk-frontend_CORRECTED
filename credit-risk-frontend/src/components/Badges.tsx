import React from "react";
import { tierFromProbability, TIER_COLOR, TIER_LABEL, recommendationClass } from "../utils/riskBands";

export function RiskTierBadge({ probability }: { probability: number }) {
  const tier = tierFromProbability(probability);
  return (
    <span className="band-chip" style={{ background: TIER_COLOR[tier] }}>
      {TIER_LABEL[tier]}
    </span>
  );
}

export function RecommendationBadge({ recommendation }: { recommendation: string }) {
  return <span className={`rec-chip ${recommendationClass(recommendation)}`}>{recommendation}</span>;
}
