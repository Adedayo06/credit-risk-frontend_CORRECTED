import React, { useCallback, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { UploadCloud, Download, FileWarning, Loader2, FileText } from "lucide-react";
import { ApplicantFeatures, BatchScoreResponse, ScoreReportSummary } from "../api/types";
import { api } from "../api/client";
import { RiskTierBadge, RecommendationBadge } from "../components/Badges";
import { useAuth } from "../context/AuthContext";
import { usePredictions } from "../context/PredictionsContext";
import "./BatchScoring.css";

const REQUIRED_COLUMNS: string[] = [
  "id",
  "limit_bal",
  "sex",
  "education",
  "marriage",
  "age",
  "pay_0",
  "pay_2",
  "pay_3",
  "pay_4",
  "pay_5",
  "pay_6",
  "bill_amt1",
  "bill_amt2",
  "bill_amt3",
  "bill_amt4",
  "bill_amt5",
  "bill_amt6",
  "pay_amt1",
  "pay_amt2",
  "pay_amt3",
  "pay_amt4",
  "pay_amt5",
  "pay_amt6",
];

interface ParsedRow {
  id: number;
  features: ApplicantFeatures;
}

export default function BatchScoring() {
  const { user } = useAuth();
  const { addPredictions } = usePredictions();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [report, setReport] = useState<BatchScoreResponse | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [reports, setReports] = useState<ScoreReportSummary[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");

  const loadReports = useCallback(() => {
    setReportsLoading(true);
    setReportsError("");
    api
      .listScoreReports()
      .then(setReports)
      .catch(() =>
        setReportsError(
          "Couldn't load past reports. Make sure the batch scoring service is running on port 8001."
        )
      )
      .finally(() => setReportsLoading(false));
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    setParseError("");
    setReport(null);
    setScoreError("");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        try {
          const data = parsed.data as Record<string, string>[];
          const missing = REQUIRED_COLUMNS.filter((c) => !(c in (data[0] ?? {})));
          if (data.length === 0) {
            setParseError("The file has no data rows.");
            setRows([]);
            return;
          }
          if (missing.length > 0) {
            setParseError(`Missing expected columns: ${missing.join(", ")}`);
            setRows([]);
            return;
          }
          const parsedRows: ParsedRow[] = data.map((r) => ({
            id: Number(r.id),
            features: {
              limit_bal: Number(r.limit_bal),
              sex: Number(r.sex),
              education: Number(r.education),
              marriage: Number(r.marriage),
              age: Number(r.age),
              pay_0: Number(r.pay_0),
              pay_2: Number(r.pay_2),
              pay_3: Number(r.pay_3),
              pay_4: Number(r.pay_4),
              pay_5: Number(r.pay_5),
              pay_6: Number(r.pay_6),
              bill_amt1: Number(r.bill_amt1),
              bill_amt2: Number(r.bill_amt2),
              bill_amt3: Number(r.bill_amt3),
              bill_amt4: Number(r.bill_amt4),
              bill_amt5: Number(r.bill_amt5),
              bill_amt6: Number(r.bill_amt6),
              pay_amt1: Number(r.pay_amt1),
              pay_amt2: Number(r.pay_amt2),
              pay_amt3: Number(r.pay_amt3),
              pay_amt4: Number(r.pay_amt4),
              pay_amt5: Number(r.pay_amt5),
              pay_amt6: Number(r.pay_amt6),
            },
          }));
          setRows(parsedRows);
        } catch {
          setParseError("Could not parse this file. Check it matches the expected template.");
          setRows([]);
        }
      },
      error: () => setParseError("Could not read this file."),
    });
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function runBatch() {
    setScoring(true);
    setScoreError("");
    try {
      const result = await api.scoreBatch(fileName || null, rows);
      setReport(result);
      // Feed successfully-scored rows into the shared prediction history so
      // the dashboard and history page reflect real activity.
      addPredictions(
        result.results.map((r) => ({
          applicantId: r.id,
          probability: r.probability_of_default,
          defaultPrediction: r.default_prediction,
          riskBand: r.risk_band,
          recommendation: r.recommendation,
          scoredAt: new Date().toISOString(),
          analyst: user?.name ?? "Analyst",
        }))
      );
      loadReports();
    } catch {
      setScoreError(
        "Couldn't score this batch. Make sure both the model service (port 8000) and batch scoring service (port 8001) are running."
      );
    } finally {
      setScoring(false);
    }
  }

  function downloadTemplate() {
    const csv =
      REQUIRED_COLUMNS.join(",") +
      "\n" +
      "1001,200000,1,2,2,34,0,0,0,0,0,0,45000,42000,40000,38000,35000,32000,5000,5000,4500,4000,4000,3500\n";
    triggerBlobDownload(csv, "batch-scoring-template.csv");
  }

  async function downloadReportCsv(reportId: string, hintName?: string | null) {
    try {
      const res = await fetch(api.scoreReportCsvUrl(reportId));
      if (!res.ok) throw new Error(`Download failed with ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = hintName ? `${hintName.replace(/\.csv$/i, "")}-scored.csv` : `score-report-${reportId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : "Could not download this report.");
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Batch scoring</span>
          <h1 className="page-title">Score a portfolio at once</h1>
          <p className="page-subtitle">
            Upload a CSV of applicants using the 23-feature template. The whole batch is
            sent to your batch-scoring service in one request and persisted as a report.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={downloadTemplate}>
          <Download size={15} />
          Download CSV template
        </button>
      </div>

      <div
        className={"dropzone" + (dragOver ? " dropzone-active" : "")}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <UploadCloud size={26} />
        <div className="dropzone-title">
          {fileName ? fileName : "Drop a CSV file here, or click to browse"}
        </div>
        <div className="dropzone-hint">Expected columns match the downloadable template</div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {parseError && (
        <div className="parse-error">
          <FileWarning size={16} />
          {parseError}
        </div>
      )}

      {rows.length > 0 && !parseError && (
        <div className="batch-actions">
          <span>
            <strong>{rows.length}</strong> applicant{rows.length === 1 ? "" : "s"} ready to score.
          </span>
          <button className="btn btn-amber" onClick={runBatch} disabled={scoring}>
            {scoring ? <Loader2 size={16} className="spin" /> : null}
            {scoring ? "Scoring batch…" : "Run batch scoring"}
          </button>
        </div>
      )}

      {scoreError && (
        <div className="parse-error" style={{ marginTop: 16 }}>
          <FileWarning size={16} />
          {scoreError}
        </div>
      )}

      {report && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="chart-card-head" style={{ padding: "20px 24px 8px" }}>
            <h3>
              Report <span className="mono" style={{ fontWeight: 400 }}>#{report.report_id.slice(0, 8)}</span>
            </h3>
            <button className="btn btn-ghost" onClick={() => downloadReportCsv(report.report_id, fileName)}>
              <Download size={15} />
              Export CSV
            </button>
          </div>
          <div className="batch-summary">
            <SummaryStat label="Total" value={report.total_records} />
            <SummaryStat label="Scored" value={report.successful} tone="success" />
            <SummaryStat label="Failed" value={report.failed} tone={report.failed > 0 ? "danger" : undefined} />
          </div>

          {report.results.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Probability</th>
                  <th>Band</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">#{r.id}</td>
                    <td className="mono">{(r.probability_of_default * 100).toFixed(1)}%</td>
                    <td>
                      <RiskTierBadge probability={r.probability_of_default} />
                    </td>
                    <td>
                      <RecommendationBadge recommendation={r.recommendation} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {report.errors.length > 0 && (
            <div className="batch-errors">
              <h4>
                <FileWarning size={14} /> {report.errors.length} row{report.errors.length === 1 ? "" : "s"} failed
              </h4>
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Applicant</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {report.errors.map((e) => (
                    <tr key={e.row_index}>
                      <td className="mono">{e.row_index}</td>
                      <td className="mono">{e.id ?? "—"}</td>
                      <td>{e.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <div className="chart-card-head" style={{ padding: "20px 24px 8px" }}>
          <h3>Recent batch reports</h3>
        </div>
        {reportsError && (
          <div className="parse-error" style={{ margin: "0 24px 16px" }}>
            <FileWarning size={16} />
            {reportsError}
          </div>
        )}
        {reportsLoading ? (
          <div className="empty-state">
            <Loader2 size={20} className="spin" />
            <p style={{ marginTop: 8 }}>Loading past reports&hellip;</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <h3>No batch reports yet</h3>
            <p>Run a batch above and it will show up here, persisted by the batch-scoring service.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Total</th>
                <th>Scored</th>
                <th>Failed</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.report_id}>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <FileText size={14} style={{ color: "var(--text-secondary)" }} />
                      {r.file_name ?? "Untitled upload"}
                    </span>
                  </td>
                  <td className="mono">{r.total_records}</td>
                  <td className="mono">{r.successful}</td>
                  <td className="mono">{r.failed}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "6px 10px", fontSize: 12.5 }}
                      onClick={() => downloadReportCsv(r.report_id, r.file_name)}
                    >
                      <Download size={13} />
                      CSV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "danger";
}) {
  return (
    <div className={"summary-stat" + (tone ? ` summary-stat-${tone}` : "")}>
      <div className="summary-stat-value mono">{value}</div>
      <div className="summary-stat-label">{label}</div>
    </div>
  );
}

function triggerBlobDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
