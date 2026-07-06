import React from "react";
import { RiskTier, TIER_COLOR, tierFromProbability, TIER_LABEL } from "../utils/riskBands";
import "./RiskGauge.css";

interface Props {
  probability: number; // 0-1
  backendLabel?: string; // the backend's own risk_band string, shown verbatim if present
  size?: number;
}

// A semicircular gauge with three wedges matching main.py's exact thresholds:
// Low (<10%), Medium (10-35%), High (>=35%), plus a needle at the score.
export default function RiskGauge({ probability, backendLabel, size = 220 }: Props) {
  const width = size;
  const height = size * 0.62;
  const cx = width / 2;
  const cy = height - 6;
  const r = width / 2 - 14;

  const tier = tierFromProbability(probability);
  const boundaries = [0, 0.1, 0.35, 1];
  const wedges: { key: RiskTier; from: number; to: number }[] = [
    { key: "low", from: boundaries[0], to: boundaries[1] },
    { key: "medium", from: boundaries[1], to: boundaries[2] },
    { key: "high", from: boundaries[2], to: boundaries[3] },
  ];

  const toAngle = (t: number) => Math.PI - t * Math.PI; // 0 -> 180deg, 1 -> 0deg
  const point = (t: number, radius: number) => {
    const a = toAngle(t);
    return { x: cx + radius * Math.cos(a), y: cy - radius * Math.sin(a) };
  };

  const arcPath = (from: number, to: number) => {
    const p1 = point(from, r);
    const p2 = point(to, r);
    const largeArc = to - from > 0.5 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
  };

  const needleAngle = toAngle(Math.min(1, probability));
  const needleTip = {
    x: cx + (r - 18) * Math.cos(needleAngle),
    y: cy - (r - 18) * Math.sin(needleAngle),
  };

  return (
    <div className="risk-gauge" style={{ width }}>
      <svg width={width} height={height + 8} viewBox={`0 0 ${width} ${height + 8}`}>
        {wedges.map(({ key, from, to }) => (
          <path
            key={key}
            d={arcPath(from, to)}
            stroke={TIER_COLOR[key]}
            strokeWidth={14}
            fill="none"
            strokeLinecap="butt"
            opacity={key === tier ? 1 : 0.35}
          />
        ))}
        <line
          x1={cx}
          y1={cy}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="var(--ink-900)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={5} fill="var(--ink-900)" />
      </svg>
      <div className="risk-gauge-readout">
        <div className="risk-gauge-value mono">{(probability * 100).toFixed(1)}%</div>
        <div className="risk-gauge-caption">probability of default</div>
        <div className="band-chip" style={{ background: TIER_COLOR[tier] }}>
          {backendLabel ?? `${TIER_LABEL[tier]} risk`}
        </div>
      </div>
    </div>
  );
}
