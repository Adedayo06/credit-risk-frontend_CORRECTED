import React from "react";
import { LucideIcon } from "lucide-react";
import "./KpiCard.css";

interface Props {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: "ink" | "amber" | "success" | "danger";
}

export default function KpiCard({ label, value, hint, icon: Icon, accent = "ink" }: Props) {
  return (
    <div className="card card-pad kpi-card">
      <div className={`kpi-icon kpi-icon-${accent}`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value mono">{value}</div>
        {hint && <div className="kpi-hint">{hint}</div>}
      </div>
    </div>
  );
}
