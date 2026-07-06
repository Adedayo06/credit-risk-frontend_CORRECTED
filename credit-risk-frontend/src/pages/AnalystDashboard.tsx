import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Gauge, CheckCircle2, AlertTriangle, ClipboardList } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import KpiCard from "../components/KpiCard";
import { RiskTierBadge, RecommendationBadge } from "../components/Badges";
import { TIER_COLOR, tierFromProbability } from "../utils/riskBands";
import { usePredictions } from "../context/PredictionsContext";
import { ScoreResult } from "../api/types";

export default function AnalystDashboard() {
  const { predictions } = usePredictions();

  const stats = useMemo(() => deriveStats(predictions), [predictions]);
  const hasData = predictions.length > 0;

  return (
    <>
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Analyst workspace</span>
          <h1 className="page-title">Hi there, good to see you</h1>
          <p className="page-subtitle">
            A snapshot of your scoring activity and where to pick up next.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/scoring/individual" className="btn btn-amber">
            Score an applicant
          </Link>
          <Link to="/scoring/batch" className="btn btn-ghost">
            Upload a batch
          </Link>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 22 }}>
        <KpiCard
          label="Predictions today"
          value={String(stats.today)}
          hint="Across individual and batch scoring"
          icon={Gauge}
        />
        <KpiCard
          label="Approve rate"
          value={pct(stats.approveRate)}
          hint="Probability < 10%"
          icon={CheckCircle2}
          accent="success"
        />
        <KpiCard
          label="Decline rate"
          value={pct(stats.declineRate)}
          hint="Probability ≥ 35%"
          icon={AlertTriangle}
          accent="danger"
        />
        <KpiCard
          label="Total scored"
          value={String(predictions.length)}
          hint="All applicants you have scored"
          icon={ClipboardList}
          accent="amber"
        />
      </div>

      {!hasData ? (
        <div className="card card-pad">
          <div className="empty-state" style={{ padding: "40px 8px" }}>
            <h3>No predictions yet</h3>
            <p>
              Score an applicant or upload a batch and your activity — charts, risk bands
              and recent predictions — will appear here.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", marginBottom: 22 }}>
            <div className="card card-pad">
              <div className="chart-card-head">
                <h3>Daily predictions</h3>
                <span className="page-eyebrow" style={{ marginBottom: 0 }}>
                  last 7 days
                </span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.daily}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--paper-border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "var(--paper-50)" }} />
                  <Bar dataKey="count" fill="var(--ink-800)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card card-pad">
              <div className="chart-card-head">
                <h3>Approve / review / decline</h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.outcome}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {stats.outcome.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={28}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(v: number) => `${v}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card card-pad" style={{ marginBottom: 22 }}>
            <div className="chart-card-head">
              <h3>Risk band distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.tiers} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--paper-border)" />
                <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip cursor={{ fill: "var(--paper-50)" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.tiers.map((d) => (
                    <Cell key={d.tier} fill={TIER_COLOR[d.tier as keyof typeof TIER_COLOR]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="chart-card-head" style={{ padding: "20px 24px 8px" }}>
              <h3>Recent predictions</h3>
              <Link to="/history" className="page-eyebrow" style={{ marginBottom: 0, textDecoration: "none" }}>
                View all &rarr;
              </Link>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Probability</th>
                  <th>Band</th>
                  <th>Recommendation</th>
                  <th>Analyst</th>
                  <th>Scored</th>
                </tr>
              </thead>
              <tbody>
                {predictions.slice(0, 8).map((p, i) => (
                  <tr key={`${p.applicantId}-${i}`}>
                    <td className="mono">#{p.applicantId}</td>
                    <td className="mono">{(p.probability * 100).toFixed(1)}%</td>
                    <td>
                      <RiskTierBadge probability={p.probability} />
                    </td>
                    <td>
                      <RecommendationBadge recommendation={p.recommendation} />
                    </td>
                    <td>{p.analyst}</td>
                    <td>{new Date(p.scoredAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

function deriveStats(predictions: ScoreResult[]) {
  const total = predictions.length || 1;
  let approve = 0;
  let review = 0;
  let decline = 0;
  const tierCount = { low: 0, medium: 0, high: 0 };

  for (const p of predictions) {
    const tier = tierFromProbability(p.probability);
    tierCount[tier] += 1;
    if (tier === "low") approve += 1;
    else if (tier === "medium") review += 1;
    else decline += 1;
  }

  const todayStr = new Date().toDateString();
  const today = predictions.filter((p) => new Date(p.scoredAt).toDateString() === todayStr).length;

  // Last 7 calendar days, oldest -> newest.
  const daily: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    const key = d.toDateString();
    const count = predictions.filter((p) => new Date(p.scoredAt).toDateString() === key).length;
    daily.push({ day: label, count });
  }

  return {
    today,
    approveRate: approve / total,
    declineRate: decline / total,
    daily,
    outcome: [
      { name: "Approve", value: approve, color: "#1f8a5f" },
      { name: "Manual review", value: review, color: "#d9a92b" },
      { name: "Decline", value: decline, color: "#c23d3d" },
    ],
    tiers: [
      { tier: "low", label: "Low", count: tierCount.low },
      { tier: "medium", label: "Medium", count: tierCount.medium },
      { tier: "high", label: "High", count: tierCount.high },
    ],
  };
}

function pct(v: number) {
  return `${(v * 100).toFixed(0)}%`;
}
