import React, { useMemo, useState } from "react";
import { ArrowDownUp, Download, Search } from "lucide-react";
import { RiskTierBadge, RecommendationBadge } from "../components/Badges";
import { ScoreResult } from "../api/types";
import { RiskTier, tierFromProbability } from "../utils/riskBands";
import { usePredictions } from "../context/PredictionsContext";
import "./PredictionHistory.css";

type SortKey = "applicantId" | "probability" | "scoredAt";

export default function PredictionHistory() {
  const { predictions } = usePredictions();
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<RiskTier | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("scoredAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    let data = [...predictions];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      data = data.filter(
        (r) => String(r.applicantId).includes(q) || r.analyst.toLowerCase().includes(q)
      );
    }
    if (tierFilter !== "all") {
      data = data.filter((r) => tierFromProbability(r.probability) === tierFilter);
    }
    data.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "applicantId") return (a.applicantId - b.applicantId) * dir;
      if (sortKey === "probability") return (a.probability - b.probability) * dir;
      return (new Date(a.scoredAt).getTime() - new Date(b.scoredAt).getTime()) * dir;
    });
    return data;
  }, [predictions, query, tierFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function exportCsv() {
    const header = "applicant_id,probability,risk_band,recommendation,analyst,scored_at";
    const lines = rows.map(
      (r: ScoreResult) =>
        `${r.applicantId},${r.probability.toFixed(4)},${r.riskBand},${r.recommendation},${r.analyst},${r.scoredAt}`
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prediction-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Prediction history</span>
          <h1 className="page-title">Every scored applicant, searchable</h1>
          <p className="page-subtitle">
            Filter by risk band or search by applicant and analyst, then export what you need.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={exportCsv}>
          <Download size={15} />
          Export CSV
        </button>
      </div>

      <div className="history-toolbar">
        <div className="history-search">
          <Search size={16} />
          <input
            placeholder="Search applicant ID or analyst"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value as RiskTier | "all")}>
          <option value="all">All bands</option>
          <option value="low">Low risk</option>
          <option value="medium">Medium risk</option>
          <option value="high">High risk</option>
        </select>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>
                <SortHeader label="Applicant" active={sortKey === "applicantId"} dir={sortDir} onClick={() => toggleSort("applicantId")} />
              </th>
              <th>
                <SortHeader label="Probability" active={sortKey === "probability"} dir={sortDir} onClick={() => toggleSort("probability")} />
              </th>
              <th>Band</th>
              <th>Recommendation</th>
              <th>Analyst</th>
              <th>
                <SortHeader label="Scored" active={sortKey === "scoredAt"} dir={sortDir} onClick={() => toggleSort("scoredAt")} />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.applicantId}>
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <h3>No predictions match</h3>
                    <p>Try a different search term or clear the band filter.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button className={"sort-header" + (active ? " active" : "")} onClick={onClick}>
      {label}
      <ArrowDownUp size={12} style={{ opacity: active ? 1 : 0.4 }} />
    </button>
  );
}
