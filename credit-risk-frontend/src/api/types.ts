export type Role = "analyst" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// Mirrors CreditApplication in main.py exactly — field names match the
// pydantic model 1:1 so no mapping is needed when building the request body.
export interface ApplicantFeatures {
  limit_bal: number;
  sex: number;
  education: number;
  marriage: number;
  age: number;

  pay_0: number;
  pay_2: number;
  pay_3: number;
  pay_4: number;
  pay_5: number;
  pay_6: number;

  bill_amt1: number;
  bill_amt2: number;
  bill_amt3: number;
  bill_amt4: number;
  bill_amt5: number;
  bill_amt6: number;

  pay_amt1: number;
  pay_amt2: number;
  pay_amt3: number;
  pay_amt4: number;
  pay_amt5: number;
  pay_amt6: number;
}

// Mirrors the JSON shape returned by POST /score in main.py.
export interface ScoreApiResponse {
  default_prediction: 0 | 1;
  probability_of_default: number;
  risk_band: string; // "Low risk of default" | "Medium risk of default" | "High risk of default"
  recommendation: string; // "Approve" | "Send for manual review" | "Decline"
}

// Enriched client-side record: the API response plus context the backend
// doesn't return (applicant id, who scored it, when — main.py has no
// persistence, so we track this in the browser).
export interface ScoreResult {
  applicantId: number;
  probability: number;
  defaultPrediction: 0 | 1;
  riskBand: string;
  recommendation: string;
  scoredAt: string;
  analyst: string;
}

export interface Analyst {
  id: string;
  name: string;
  email: string;
  status: "active" | "suspended";
  role: Role;
  joinedAt: string;
  predictionsThisMonth: number;
}

export interface PsiFeaturePoint {
  feature: string;
  psi: number;
  status?: string; // "Stable" | "Moderate Drift" | "Significant Drift" (from /psi)
}

// Full drift payload from GET /psi: per-feature PSI plus the backend's
// overall, model-level drift verdict.
export interface DriftReport {
  features: PsiFeaturePoint[];
  overall: string;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  rocAuc: number;
  confusionMatrix: [[number, number], [number, number]];
}

// --- Batch Scoring API (separate service, main.py "Credit Risk Batch
// Scoring API") --------------------------------------------------------
// This service persists every batch run as a "score report" and itself
// calls the individual-scoring service's POST /score per record.

// A row scored successfully: the original payload plus the result.
export interface BatchScoredRecord extends ApplicantFeatures {
  id: number;
  row_index: number;
  default_prediction: 0 | 1;
  probability_of_default: number;
  risk_band: string; // "Low risk of default" | "Medium risk of default" | "High risk of default"
  recommendation: string; // "Approve" | "Send for manual review" | "Decline"
}

export interface BatchScoreError {
  row_index: number;
  id: number | null;
  error: string;
}

export interface BatchScoreResponse {
  report_id: string;
  total_records: number;
  successful: number;
  failed: number;
  results: BatchScoredRecord[];
  errors: BatchScoreError[];
}

export interface ScoreReportSummary {
  report_id: string;
  file_name: string | null;
  total_records: number;
  successful: number;
  failed: number;
  created_at: string;
}

export interface ScoreReportRowDetail extends ApplicantFeatures {
  row_index: number;
  id: number;
  default_prediction: 0 | 1 | null;
  probability_of_default: number | null;
  risk_band: string | null;
  recommendation: string | null;
  error: string | null;
}

export interface ScoreReportDetail extends ScoreReportSummary {
  rows: ScoreReportRowDetail[];
}
