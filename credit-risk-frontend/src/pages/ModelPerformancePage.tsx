import React, { useEffect, useState } from "react";
import { Target, Crosshair, ScanEye, Sigma, TrendingUp } from "lucide-react";
import { ModelPerformance } from "../api/types";
import { api } from "../api/client";
import KpiCard from "../components/KpiCard";
import "./ModelPerformancePage.css";

export default function ModelPerformancePage() {
  const [perf, setPerf] = useState<ModelPerformance | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.modelPerformance().then(setPerf).catch(() => setError(true));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Administrator</span>
          <h1 className="page-title">Model performance</h1>
          <p className="page-subtitle">
            Random Forest classifier trained on the UCI Taiwan Default Payments dataset
            (30,000 records, 23 features, 80/20 split).
          </p>
        </div>
      </div>

      {error && (
        <div className="card card-pad">
          <div className="empty-state" style={{ padding: "40px 8px" }}>
            <h3>Metrics unavailable</h3>
            <p>Couldn&rsquo;t load model metrics. Make sure the model service is running on port 8000.</p>
          </div>
        </div>
      )}

      {perf && (
        <>
          <div className="grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 22 }}>
            <KpiCard label="Accuracy" value={pct(perf.accuracy)} icon={Target} />
            <KpiCard label="Precision" value={pct(perf.precision)} icon={Crosshair} />
            <KpiCard label="Recall" value={pct(perf.recall)} icon={ScanEye} />
            <KpiCard label="F1 score" value={pct(perf.f1)} icon={Sigma} />
            <KpiCard label="ROC-AUC" value={perf.rocAuc.toFixed(2)} icon={TrendingUp} accent="amber" />
          </div>

          <div className="card card-pad" style={{ marginBottom: 22 }}>
            <div className="chart-card-head">
              <h3>Confusion matrix</h3>
            </div>
            <ConfusionMatrix matrix={perf.confusionMatrix} />
          </div>
        </>
      )}
    </>
  );
}

function pct(v: number) {
  return `${(v * 100).toFixed(0)}%`;
}

function ConfusionMatrix({ matrix }: { matrix: [[number, number], [number, number]] }) {
  const [[tn, fp], [fn, tp]] = matrix;
  const total = tn + fp + fn + tp;
  return (
    <div className="confusion-wrap">
      <div className="confusion-grid">
        <div className="confusion-cell confusion-corner" />
        <div className="confusion-cell confusion-label">Predicted: No default</div>
        <div className="confusion-cell confusion-label">Predicted: Default</div>

        <div className="confusion-cell confusion-label">Actual: No default</div>
        <div className="confusion-cell confusion-value confusion-good">{tn.toLocaleString()}</div>
        <div className="confusion-cell confusion-value confusion-bad">{fp.toLocaleString()}</div>

        <div className="confusion-cell confusion-label">Actual: Default</div>
        <div className="confusion-cell confusion-value confusion-bad">{fn.toLocaleString()}</div>
        <div className="confusion-cell confusion-value confusion-good">{tp.toLocaleString()}</div>
      </div>
      <p className="confusion-footnote">
        {total.toLocaleString()} test cases &middot; {tp.toLocaleString()} true positives &middot;{" "}
        {tn.toLocaleString()} true negatives
      </p>
    </div>
  );
}
