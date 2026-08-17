import {
  ApplicantFeatures,
  BatchScoreResponse,
  DriftReport,
  ModelPerformance,
  PsiFeaturePoint,
  ScoreApiResponse,
  ScoreReportDetail,
  ScoreReportSummary,
  ScoreResult,
} from "./types";

// Individual-scoring service (POST /score, GET /health, GET /metrics).
//
// In local dev this falls back to "/api", which vite.config.ts proxies to
// http://localhost:8000. In production (Vercel), set VITE_MODEL_API_URL to
// the deployed credit-risk-api URL (e.g. https://credit-risk-model-api.onrender.com)
// — Vercel has no dev-server proxy, so a real absolute URL is required
// there.
const BASE_URL = import.meta.env.VITE_MODEL_API_URL ?? "/api";

// Batch Scoring API — a separate service that persists every batch run as
// a "score report", itself calls the individual-scoring service per record,
// and (since it owns the score-report database) also serves GET /psi.
//
// In local dev this falls back to "/api/batch", proxied to
// http://localhost:8001 in vite.config.ts. In production, set
// VITE_BATCH_API_URL to the deployed batch-api URL (e.g.
// https://credit-risk-batch-api.onrender.com).
const BATCH_BASE_URL = import.meta.env.VITE_BATCH_API_URL ?? "/api/batch";

// Thrown when the backend can't be reached at all (service not running,
// wrong port, network down) — as opposed to a bad HTTP response.
export class ApiConnectionError extends Error {}

async function request<T>(base: string, path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    // fetch() rejects (not res.ok === false) when the server is unreachable.
    throw new ApiConnectionError(
      "Can't reach the scoring service. Make sure the backend is running."
    );
  }
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.detail ? `: ${JSON.stringify(body.detail)}` : "";
    } catch {
      /* response wasn't JSON */
    }
    throw new Error(`Request failed (${res.status})${detail}`);
  }
  return res.json() as Promise<T>;
}

function toScoreResult(applicantId: number, api: ScoreApiResponse, analyst: string): ScoreResult {
  return {
    applicantId,
    probability: api.probability_of_default,
    defaultPrediction: api.default_prediction,
    riskBand: api.risk_band,
    recommendation: api.recommendation,
    scoredAt: new Date().toISOString(),
    analyst,
  };
}

// generate_psi_report()'s exact return shape isn't known here (psi_report.py
// wasn't shared), so this normalizes a few likely shapes:
//   [{feature, psi}, ...]  |  [{name, PSI}, ...]  |  {feature: psi, ...}
//   {results: [...]}       |  {features: [...]}
// If your real response doesn't match, tweak this function — everything
// downstream just consumes PsiFeaturePoint[].
function normalizePsi(raw: unknown): PsiFeaturePoint[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item): PsiFeaturePoint | null => {
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          const feature = obj.feature ?? obj.name ?? obj.column ?? obj.Feature;
          const psi = obj.psi ?? obj.PSI ?? obj.value ?? obj.psi_value;
          const status = obj.status ?? obj.Status;
          if (feature !== undefined && psi !== undefined) {
            return {
              feature: String(feature),
              psi: Number(psi),
              status: status !== undefined ? String(status) : undefined,
            };
          }
        }
        return null;
      })
      .filter((x): x is PsiFeaturePoint => x !== null);
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.report)) return normalizePsi(obj.report);
    if (Array.isArray(obj.results)) return normalizePsi(obj.results);
    if (Array.isArray(obj.features)) return normalizePsi(obj.features);
    if (Array.isArray(obj.psi)) return normalizePsi(obj.psi);
    // Fall back to treating it as a flat { feature_name: psi_value } map.
    return Object.entries(obj)
      .filter(([, v]) => typeof v === "number" || typeof v === "string")
      .map(([feature, psi]) => ({ feature, psi: Number(psi) }));
  }
  return [];
}

export const api = {
  // GET /health (individual-scoring service)
  async health(): Promise<{ status: string }> {
    return request(BASE_URL, "/health");
  },

  // POST /score — single applicant. `id` must be an integer to match
  // CreditApplication in main.py.
  async scoreApplicant(id: number, features: ApplicantFeatures, analyst: string): Promise<ScoreResult> {
    const body = { id, ...features };
    const result = await request<ScoreApiResponse>(BASE_URL, "/score", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return toScoreResult(id, result, analyst);
  },

  // GET /psi (Batch Scoring API — it's the service with the database drift
  // is computed from). Returns an empty set if the endpoint isn't available
  // yet (e.g. no baseline configured server-side) so the drift views show an
  // honest empty state instead of an error.
  async psi(): Promise<PsiFeaturePoint[]> {
    try {
      const raw = await request<unknown>(BATCH_BASE_URL, "/psi");
      return normalizePsi(raw);
    } catch {
      return [];
    }
  },

  // GET /psi — full drift report: per-feature PSI plus the backend's overall,
  // model-level verdict (the `{ report, overall }` shape). Falls back to an
  // empty report + blank verdict if the endpoint is unavailable.
  async drift(): Promise<DriftReport> {
    try {
      const raw = await request<unknown>(BATCH_BASE_URL, "/psi");
      const overall =
        raw && typeof raw === "object" && typeof (raw as { overall?: unknown }).overall === "string"
          ? (raw as { overall: string }).overall
          : "";
      return { features: normalizePsi(raw), overall };
    } catch {
      return { features: [], overall: "" };
    }
  },

  // POST /batch-score (Batch Scoring API). Sends every row in one request;
  // the service persists the run as a score report and scores each record
  // against the individual-scoring service itself.
  async scoreBatch(
    fileName: string | null,
    records: { id: number; features: ApplicantFeatures }[]
  ): Promise<BatchScoreResponse> {
    return request<BatchScoreResponse>(BATCH_BASE_URL, "/batch-score", {
      method: "POST",
      body: JSON.stringify({
        file_name: fileName,
        records: records.map((r) => ({ id: r.id, ...r.features })),
      }),
    });
  },

  // GET /score-reports
  async listScoreReports(): Promise<ScoreReportSummary[]> {
    return request<ScoreReportSummary[]>(BATCH_BASE_URL, "/score-reports");
  },

  // GET /score-reports/{report_id}
  async getScoreReport(reportId: string): Promise<ScoreReportDetail> {
    return request<ScoreReportDetail>(BATCH_BASE_URL, `/score-reports/${reportId}`);
  },

  // GET /score-reports/{report_id}/csv — a direct download URL, not a
  // fetch call, since it's a file stream best handled by the browser.
  scoreReportCsvUrl(reportId: string): string {
    return `${BATCH_BASE_URL}/score-reports/${reportId}/csv`;
  },

  // GET /metrics — the model service returns the trained model's real
  // evaluation metrics (metrics.json). We read the random_forest block, which
  // is the model actually served by POST /score.
  async modelPerformance(): Promise<ModelPerformance> {
    const raw = await request<Record<string, RawModelMetrics>>(BASE_URL, "/metrics");
    return normalizeMetrics(raw.random_forest ?? Object.values(raw)[0]);
  },
};

interface RawModelMetrics {
  roc_auc: number;
  confusion_matrix: [[number, number], [number, number]];
  classification_report: {
    accuracy: number;
    "weighted avg": { precision: number; recall: number; "f1-score": number };
  };
}

function normalizeMetrics(m: RawModelMetrics): ModelPerformance {
  const w = m.classification_report["weighted avg"];
  return {
    accuracy: m.classification_report.accuracy,
    precision: w.precision,
    recall: w.recall,
    f1: w["f1-score"],
    rocAuc: m.roc_auc,
    confusionMatrix: m.confusion_matrix,
  };
}
