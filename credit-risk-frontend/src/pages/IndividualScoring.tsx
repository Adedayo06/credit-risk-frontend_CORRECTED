import React, { useState } from "react";
import { Loader2, Send, TriangleAlert } from "lucide-react";
import { ApplicantFeatures, ScoreResult } from "../api/types";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { usePredictions } from "../context/PredictionsContext";
import RiskGauge from "../components/RiskGauge";
import { RecommendationBadge } from "../components/Badges";
import "./IndividualScoring.css";

const DEFAULT_FEATURES: ApplicantFeatures = {
  limit_bal: 200000,
  sex: 1,
  education: 2,
  marriage: 2,
  age: 34,
  pay_0: 0,
  pay_2: 0,
  pay_3: 0,
  pay_4: 0,
  pay_5: 0,
  pay_6: 0,
  bill_amt1: 45000,
  bill_amt2: 42000,
  bill_amt3: 40000,
  bill_amt4: 38000,
  bill_amt5: 35000,
  bill_amt6: 32000,
  pay_amt1: 5000,
  pay_amt2: 5000,
  pay_amt3: 4500,
  pay_amt4: 4000,
  pay_amt5: 4000,
  pay_amt6: 3500,
};

const PAY_FIELDS: { key: keyof ApplicantFeatures; label: string }[] = [
  { key: "pay_0", label: "Repayment status, Month 1" },
  { key: "pay_2", label: "Repayment status, Month 2" },
  { key: "pay_3", label: "Repayment status, Month 3" },
  { key: "pay_4", label: "Repayment status, Month 4" },
  { key: "pay_5", label: "Repayment status, Month 5" },
  { key: "pay_6", label: "Repayment status, Month 6" },
];

const BILL_FIELDS: { key: keyof ApplicantFeatures; label: string }[] = [
  { key: "bill_amt1", label: "Bill amount, Month 1" },
  { key: "bill_amt2", label: "Bill amount, Month 2" },
  { key: "bill_amt3", label: "Bill amount, Month 3" },
  { key: "bill_amt4", label: "Bill amount, Month 4" },
  { key: "bill_amt5", label: "Bill amount, Month 5" },
  { key: "bill_amt6", label: "Bill amount, Month 6" },
];

const PAYAMT_FIELDS: { key: keyof ApplicantFeatures; label: string }[] = [
  { key: "pay_amt1", label: "Amount paid, Month 1" },
  { key: "pay_amt2", label: "Amount paid, Month 2" },
  { key: "pay_amt3", label: "Amount paid, Month 3" },
  { key: "pay_amt4", label: "Amount paid, Month 4" },
  { key: "pay_amt5", label: "Amount paid, Month 5" },
  { key: "pay_amt6", label: "Amount paid, Month 6" },
];

export default function IndividualScoring() {
  const { user } = useAuth();
  const { addPrediction } = usePredictions();
  const [applicantId, setApplicantId] = useState(4471);
  const [features, setFeatures] = useState<ApplicantFeatures>(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState("");

  function setField(key: keyof ApplicantFeatures, value: number) {
    setFeatures((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await api.scoreApplicant(applicantId, features, user?.name ?? "Analyst");
      setResult(res);
      addPrediction(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not score this applicant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Individual scoring</span>
          <h1 className="page-title">Score a single applicant</h1>
          <p className="page-subtitle">
            Enter the applicant&rsquo;s profile and last six months of billing history.
            The model returns a default probability, risk band, and recommendation.
          </p>
        </div>
      </div>

      <div className="scoring-layout">
        <form className="card card-pad scoring-form" onSubmit={handleSubmit}>
          <fieldset className="form-section">
            <legend>Applicant &amp; credit profile</legend>
            <div className="form-grid form-grid-3">
              <div className="field">
                <label htmlFor="applicantId">Applicant ID</label>
                <input
                  id="applicantId"
                  type="number"
                  value={applicantId}
                  onChange={(e) => setApplicantId(Number(e.target.value))}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="limit_bal">Credit limit</label>
                <input
                  id="limit_bal"
                  type="number"
                  min={0}
                  value={features.limit_bal}
                  onChange={(e) => setField("limit_bal", Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  min={18}
                  max={100}
                  value={features.age}
                  onChange={(e) => setField("age", Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label htmlFor="sex">Sex</label>
                <select id="sex" value={features.sex} onChange={(e) => setField("sex", Number(e.target.value))}>
                  <option value={1}>Male</option>
                  <option value={2}>Female</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="education">Education</label>
                <select
                  id="education"
                  value={features.education}
                  onChange={(e) => setField("education", Number(e.target.value))}
                >
                  <option value={1}>Graduate school</option>
                  <option value={2}>University</option>
                  <option value={3}>High school</option>
                  <option value={4}>Other</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="marriage">Marital status</label>
                <select
                  id="marriage"
                  value={features.marriage}
                  onChange={(e) => setField("marriage", Number(e.target.value))}
                >
                  <option value={1}>Married</option>
                  <option value={2}>Single</option>
                  <option value={3}>Other</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Repayment status, last 6 months</legend>
            <div className="form-grid form-grid-6">
              {PAY_FIELDS.map(({ key, label }) => (
                <div className="field" key={key}>
                  <label htmlFor={key}>{label}</label>
                  <input
                    id={key}
                    type="number"
                    min={-1}
                    max={9}
                    value={features[key]}
                    onChange={(e) => setField(key, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Bill statement amounts, last 6 months</legend>
            <div className="form-grid form-grid-6">
              {BILL_FIELDS.map(({ key, label }) => (
                <div className="field" key={key}>
                  <label htmlFor={key}>{label}</label>
                  <input
                    id={key}
                    type="number"
                    value={features[key]}
                    onChange={(e) => setField(key, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Previous payment amounts, last 6 months</legend>
            <div className="form-grid form-grid-6">
              {PAYAMT_FIELDS.map(({ key, label }) => (
                <div className="field" key={key}>
                  <label htmlFor={key}>{label}</label>
                  <input
                    id={key}
                    type="number"
                    value={features[key]}
                    onChange={(e) => setField(key, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          {error && (
            <div className="parse-error">
              <TriangleAlert size={16} />
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-amber" disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            {loading ? "Scoring…" : "Run credit risk score"}
          </button>
        </form>

        <div className="scoring-result-rail">
          <div className="card card-pad scoring-result-card">
            <h3 style={{ marginBottom: 4 }}>Result</h3>
            {!result && !loading && (
              <div className="empty-state" style={{ padding: "32px 8px" }}>
                <p>Fill in the applicant&rsquo;s details and run a score to see the result here.</p>
              </div> 
            )}
            {loading && (
              <div className="empty-state" style={{ padding: "32px 8px" }}>
                <Loader2 size={22} className="spin" />
                <p style={{ marginTop: 10 }}>Scoring applicant&hellip;</p>
              </div>
            )}
            {result && !loading && (
              <>
                <RiskGauge probability={result.probability} backendLabel={result.riskBand} />
                <div className="scoring-result-meta">
                  <div>
                    <span className="page-eyebrow" style={{ marginBottom: 2 }}>
                      Recommendation
                    </span>
                    <RecommendationBadge recommendation={result.recommendation} />
                  </div>
                  <div>
                    <span className="page-eyebrow" style={{ marginBottom: 2 }}>
                      Applicant
                    </span>
                    <span className="mono">#{result.applicantId}</span>
                  </div>
                  <div>
                    <span className="page-eyebrow" style={{ marginBottom: 2 }}>
                      Scored at
                    </span>
                    <span>{new Date(result.scoredAt).toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
