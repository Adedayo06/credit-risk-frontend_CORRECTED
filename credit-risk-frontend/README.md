# Credit Risk Scoring & Prediction (Frontend)

A React + TypeScript frontend (Vite, plain CSS) for a credit-risk scoring system.
It talks to **two** backend services:

1. **Model API** — `POST /score`, `GET /metrics`, `GET /health` (and optionally
   `GET /psi`). Loads the trained model and scores a single applicant.
2. **Batch API** — `POST /batch-score`, `GET /score-reports`,
   `GET /score-reports/{id}`, `GET /score-reports/{id}/csv`. Scores a whole CSV,
   calling the Model API per record, and persists every run as a "score report"
   in SQLite.

## Data sources

All figures shown come from real sources — there is no mock/fixture data:

| Feature | Source |
|---|---|
| Individual scoring | `POST /score` (Model API) |
| Batch scoring | `POST /batch-score` (Batch API) |
| Recent batch reports | `GET /score-reports` (Batch API) |
| Batch report CSV export | `GET /score-reports/{id}/csv` (Batch API) |
| Model performance (accuracy, precision, recall, F1, ROC-AUC, confusion matrix) | `GET /metrics` (Model API, from `metrics.json`) |
| Dashboard KPIs, charts, risk-band distribution, prediction history | Derived from your real scoring activity (stored per-browser in `localStorage` via `PredictionsContext`) |
| Model drift (PSI) | `GET /psi` (Model API) — shows an empty state until that endpoint exists |
| Analyst management | Managed in-session by the administrator |

## Getting started

Both backend services must run, **on different ports** (the Batch API calls the
Model API over HTTP). From the backend repo root there's a helper that launches
both at once:

```powershell
powershell -ExecutionPolicy Bypass -File .\run.ps1
```

Or start them manually:

```bash
# Model API
cd credit-risk-api && uvicorn app.main:app --reload --port 8000

# Batch API
cd batch-api && uvicorn main:app --reload --port 8001
```

Then the frontend:

```bash
npm install
npm run dev
```

Open http://localhost:5173. `vite.config.ts` proxies:
- `/api/*` → `http://localhost:8000/*` (Model API)
- `/api/batch/*` → `http://localhost:8001/*` (Batch API)

Login accepts any email/password — no auth service is wired up yet, so the role
toggle just tags the session locally.

## Batch scoring CSV format

Download the template from the Batch scoring page, or match this header (the 23
features of the UCI Taiwan Default Payments dataset):

```
id,limit_bal,sex,education,marriage,age,pay_0,pay_2,pay_3,pay_4,pay_5,pay_6,
bill_amt1,bill_amt2,bill_amt3,bill_amt4,bill_amt5,bill_amt6,
pay_amt1,pay_amt2,pay_amt3,pay_amt4,pay_amt5,pay_amt6
```

The whole parsed file is sent as one `POST /batch-score` request. Row-level
failures come back in the response's `errors` array (with a `row_index` and
message) rather than failing the whole batch, and are shown in their own table.

## Project structure

```
src/
  api/            types (mirrors both services) + client (real API calls)
  components/     Sidebar, TopBar, RiskGauge, KpiCard, badges, route guard
  context/        AuthContext (role-based session) + PredictionsContext (activity history)
  pages/          one file per route
  styles/         tokens.css (design tokens) + globals.css (base styles)
  utils/          riskBands.ts — mirrors the Model API's 0.10 / 0.35 thresholds
```

## Notes

- Risk thresholds mirror the Model API exactly: probability ≥ 0.35 → High /
  Decline, ≥ 0.10 → Medium / Manual review, otherwise Low / Approve.
- Model performance figures are the trained model's real evaluation metrics,
  served live from `metrics.json` via `GET /metrics`.
- To make prediction history shared across users/devices, add a persistence
  table + retrieval endpoint and point the history view at it (it currently
  keeps a per-browser record).
# Credit-Risk-Frontend-CORRECTED
# Credit-Risk-Frontend-CORRECTED
