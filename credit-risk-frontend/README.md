# Credit Risk Scoring & Prediction (Frontend)

A React + TypeScript frontend (Vite, plain CSS) for a credit-risk scoring
system. It talks to **two** independently deployable backend services — see
[credit-risk-backend](https://github.com/Adedayo06/credit-risk-backend_CORRECTED)
for both:

1. **Model API** (`credit-risk-api`) — `POST /score`, `GET /metrics`,
   `GET /health`. Loads the trained model and scores a single applicant. Pure
   and stateless: no database, no dependency on the other service.
2. **Batch API** (`batch-api`) — `POST /batch-score`, `GET /score-reports`,
   `GET /score-reports/{id}`, `GET /score-reports/{id}/csv`, `GET /psi`.
   Scores a whole CSV (calling the Model API per record over HTTP) and
   persists every run as a "score report." Also computes model drift (PSI)
   from its own scored-record history, since it's the service that owns
   that data.

## Live demo

- Frontend: _add your Vercel URL here once deployed_
- Model API: _add your Render URL here_
- Batch API: _add your Render URL here_

## Data sources

All figures shown come from real sources — there is no mock/fixture data:

| Feature | Source |
|---|---|
| Individual scoring | `POST /score` (Model API) |
| Batch scoring | `POST /batch-score` (Batch API) |
| Recent batch reports | `GET /score-reports` (Batch API) |
| Batch report CSV export | `GET /score-reports/{id}/csv` (Batch API) |
| Model performance (accuracy, precision, recall, F1, ROC-AUC, confusion matrix) | `GET /metrics` (Model API, from `metrics.json`) |
| Dashboard KPIs, charts, risk-band distribution, prediction history | Derived from your real scoring activity (stored per-browser via `PredictionsContext`) |
| Model drift (PSI) | `GET /psi` (Batch API) |
| Analyst management | Managed in-session by the administrator |

## Running locally

Both backend services must run, on different ports (the Batch API calls the
Model API over HTTP). From the backend repo root there's a helper that
launches both at once:

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

Open http://localhost:5173. In dev, `vite.config.ts` proxies:
- `/api/*` → `http://localhost:8000/*` (Model API)
- `/api/batch/*` → `http://localhost:8001/*` (Batch API)

No env vars are needed for local dev — the proxy handles routing. Login
accepts any email/password — no auth service is wired up yet, so the role
toggle just tags the session locally.

## Deploying (Vercel)

A production build has no dev-server proxy, so the two backend URLs must be
set as real environment variables. In your Vercel project settings:

| Variable | Value |
|---|---|
| `VITE_MODEL_API_URL` | Your deployed `credit-risk-api` URL, e.g. `https://credit-risk-model-api.onrender.com` |
| `VITE_BATCH_API_URL` | Your deployed `batch-api` URL, e.g. `https://credit-risk-batch-api.onrender.com` |

See `.env.example` for the same, for local override via `.env.local`. Set
**Root Directory** to `credit-risk-frontend` in Vercel's project settings (the
repo has one extra folder level). `vercel.json` adds the SPA rewrite needed
for client-side routing (`react-router-dom`) — without it, refreshing on any
route other than `/` 404s.

Deploy the two Render services first (see the backend repo's README) so you
have real URLs to put here, then set `ALLOWED_ORIGINS` on both Render
services to your Vercel domain once you have it, and redeploy them.

## Batch scoring CSV format

Download the template from the Batch scoring page, or match this header (the
23 features of the UCI Taiwan Default Payments dataset):

```
id,limit_bal,sex,education,marriage,age,pay_0,pay_2,pay_3,pay_4,pay_5,pay_6,
bill_amt1,bill_amt2,bill_amt3,bill_amt4,bill_amt5,bill_amt6,
pay_amt1,pay_amt2,pay_amt3,pay_amt4,pay_amt5,pay_amt6
```

The whole parsed file is sent as one `POST /batch-score` request. Row-level
failures come back in the response's `errors` array (with a `row_index` and
message) rather than failing the whole batch, and are shown in their own
table.

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
- Auth is a client-side mock (no persisted session, no backend auth service)
  — refreshing loses the logged-in user by design. Swap `AuthContext`'s
  `login()` for a real `POST /auth/login` call if you add one.
- To make prediction history shared across users/devices, add a persistence
  table + retrieval endpoint and point the history view at it (it currently
  keeps a per-browser record).
