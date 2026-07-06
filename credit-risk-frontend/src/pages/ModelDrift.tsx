import React, { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { PsiFeaturePoint } from "../api/types";
import { api } from "../api/client";
import "./ModelDrift.css";

type Severity = "stable" | "moderate" | "significant";

// Mirrors the /psi endpoint's thresholds exactly so the page never disagrees
// with the backend: psi < 0.10 Stable, < 0.20 Moderate, otherwise Significant.
function psiSeverity(psi: number): Severity {
  if (psi < 0.1) return "stable";
  if (psi < 0.2) return "moderate";
  return "significant";
}

// Prefer the backend's own status label when it sends one, falling back to the
// PSI value. Keeps per-feature colouring aligned with the /psi classification.
function severityOf(p: PsiFeaturePoint): Severity {
  if (p.status) {
    const s = p.status.toLowerCase();
    if (s.includes("significant")) return "significant";
    if (s.includes("moderate")) return "moderate";
    return "stable";
  }
  return psiSeverity(p.psi);
}

const SEVERITY_COLOR: Record<Severity, string> = {
  stable: "var(--band-a)",
  moderate: "var(--band-c)",
  significant: "var(--band-e)",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  stable: "Stable",
  moderate: "Moderate drift",
  significant: "Significant drift",
};

export default function ModelDrift() {
  const [psi, setPsi] = useState<PsiFeaturePoint[]>([]);
  const [overallMessage, setOverallMessage] = useState("");

  useEffect(() => {
    api.drift().then((report) => {
      setPsi([...report.features].sort((a, b) => b.psi - a.psi));
      setOverallMessage(report.overall);
    });
  }, []);

  const significantCount = useMemo(
    () => psi.filter((p) => severityOf(p) === "significant").length,
    [psi]
  );
  const driftDetected = significantCount > 0;

  // Model-level summary aggregated from the per-feature PSI values. The average
  // PSI summarizes overall input drift on the same severity scale, while the
  // most-drifted feature (psi is pre-sorted descending) is the worst offender.
  const summary = useMemo(() => {
    if (psi.length === 0) {
      return { avg: 0, severity: "stable" as Severity, worst: null as PsiFeaturePoint | null };
    }
    const avg = psi.reduce((sum, p) => sum + p.psi, 0) / psi.length;
    return { avg, severity: psiSeverity(avg), worst: psi[0] };
  }, [psi]);

  return (
    <>
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Administrator</span>
          <h1 className="page-title">Model drift monitoring</h1>
          <p className="page-subtitle">
            Overall model drift alongside the Population Stability Index for each
            feature. If features drift significantly, the model should be retrained.
          </p>
        </div>
      </div>

      {psi.length === 0 ? (
        <div className="card card-pad">
          <div className="empty-state" style={{ padding: "40px 8px" }}>
            <h3>No drift data available</h3>
            <p>
              Drift monitoring needs the <code>/psi</code> endpoint on the model
              service. Once it reports Population Stability Index values, they&rsquo;ll
              appear here.
            </p>
          </div>
        </div>
      ) : (
      <>
      <div className={"drift-banner" + (driftDetected ? " drift-banner-alert" : "")}>
        {driftDetected ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
        <div>
          <div className="drift-banner-title">Overall drift</div>
          <div className="drift-banner-sub">
            {overallMessage ||
              `${significantCount} of ${psi.length} features show significant drift (PSI ≥ 0.20)`}
          </div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 22 }}>
        <div className="chart-card-head">
          <h3>Overall drift</h3>
          <span className="chart-card-sub">Aggregated across all {psi.length} monitored features</span>
        </div>
        <div className="overall-drift-grid">
          <div className="overall-stat">
            <span className="overall-stat-label">Average PSI</span>
            <span className="overall-stat-value" style={{ color: SEVERITY_COLOR[summary.severity] }}>
              {summary.avg.toFixed(3)}
            </span>
            <span
              className="drift-severity-chip"
              style={{ background: SEVERITY_COLOR[summary.severity] }}
            >
              {SEVERITY_LABEL[summary.severity]}
            </span>
          </div>
          <div className="overall-stat">
            <span className="overall-stat-label">Features drifting</span>
            <span className="overall-stat-value">
              {significantCount}
              <span className="overall-stat-suffix"> / {psi.length}</span>
            </span>
            <span className="overall-stat-note">Significant (PSI &ge; 0.20)</span>
          </div>
          <div className="overall-stat">
            <span className="overall-stat-label">Most-drifted feature</span>
            <span className="overall-stat-value mono">{summary.worst?.feature ?? "—"}</span>
            <span className="overall-stat-note">
              PSI {summary.worst ? summary.worst.psi.toFixed(3) : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 22 }}>
        <div className="chart-card-head">
          <h3>Individual feature drift</h3>
          <span className="chart-card-sub">Population Stability Index per feature</span>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={psi} layout="vertical" margin={{ left: 12, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--paper-border)" />
            <XAxis type="number" domain={[0, 0.4]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="feature" tick={{ fontSize: 11.5, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} width={92} />
            <ReferenceLine x={0.1} stroke="var(--band-c)" strokeDasharray="4 4" />
            <ReferenceLine x={0.2} stroke="var(--band-e)" strokeDasharray="4 4" />
            <Tooltip formatter={(v: number) => v.toFixed(3)} />
            <Bar dataKey="psi" radius={[0, 4, 4, 0]}>
              {psi.map((p) => (
                <Cell key={p.feature} fill={SEVERITY_COLOR[severityOf(p)]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="drift-legend">
          <LegendDot color="var(--band-a)" label="Stable (< 0.10)" />
          <LegendDot color="var(--band-c)" label="Moderate (0.10 &ndash; 0.20)" />
          <LegendDot color="var(--band-e)" label="Significant (&ge; 0.20)" />
        </div>
      </div>
      </>
      )}
    </>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="drift-legend-item">
      <span className="drift-legend-dot" style={{ background: color }} />
      {label}
    </span>
  );
}
