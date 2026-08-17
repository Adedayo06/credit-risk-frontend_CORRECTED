/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Deployed credit-risk-api URL, e.g. https://credit-risk-model-api.onrender.com
   *  Falls back to the "/api" dev-server proxy (see vite.config.ts) when unset. */
  readonly VITE_MODEL_API_URL?: string;
  /** Deployed batch-api URL, e.g. https://credit-risk-batch-api.onrender.com
   *  Falls back to the "/api/batch" dev-server proxy (see vite.config.ts) when unset. */
  readonly VITE_BATCH_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
