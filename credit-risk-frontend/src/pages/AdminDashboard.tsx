import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Target, TrendingUp, Crosshair, ShieldAlert } from "lucide-react";
import KpiCard from "../components/KpiCard";
import { api } from "../api/client";
import { ModelPerformance, PsiFeaturePoint } from "../api/types";

export default function AdminDashboard() {
  const [perf, setPerf] = useState<ModelPerformance | null>(null);
  const [psi, setPsi] = useState<PsiFeaturePoint[]>([]);

  useEffect(() => {
    api.modelPerformance().then(setPerf).catch(() => setPerf(null));
    api.psi().then(setPsi);
  }, []);

  const driftingFeatures = psi.filter((p) =>
    p.status ? p.status.toLowerCase().includes("significant") : p.psi >= 0.2
  ).length;

  return (
    <>
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Administrator console</span>
          <h1 className="page-title">Hi there, good to see you</h1>
          <p className="page-subtitle">
            Model health and drift signals in one place.
          </p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 26 }}>
        <KpiCard label="Model accuracy" value={perf ? pct(perf.accuracy) : "—"} icon={Target} />
        <KpiCard label="ROC-AUC" value={perf ? perf.rocAuc.toFixed(2) : "—"} icon={TrendingUp} accent="amber" />
        <KpiCard label="Precision" value={perf ? pct(perf.precision) : "—"} icon={Crosshair} />
        <KpiCard
          label="Features drifting"
          value={String(driftingFeatures)}
          hint="PSI ≥ 0.20"
          icon={ShieldAlert}
          accent={driftingFeatures > 0 ? "danger" : "success"}
        />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <AdminLinkCard
          to="/admin/analysts"
          title="Manage analysts"
          copy="Add accounts, and suspend access when needed."
        />
        <AdminLinkCard
          to="/admin/performance"
          title="Model performance"
          copy="Accuracy, precision, recall, F1, ROC-AUC, and the confusion matrix."
        />
        <AdminLinkCard
          to="/admin/drift"
          title="Model drift (PSI)"
          copy="Population stability index by feature, with a retraining signal."
        />
      </div>
    </>
  );
}

function AdminLinkCard({ to, title, copy }: { to: string; title: string; copy: string }) {
  return (
    <Link to={to} className="card card-pad" style={{ textDecoration: "none", display: "block" }}>
      <h3 style={{ fontSize: 15.5, marginBottom: 6, color: "var(--text-primary)" }}>{title}</h3>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{copy}</p>
    </Link>
  );
}

function pct(v: number) {
  return `${(v * 100).toFixed(0)}%`;
}
