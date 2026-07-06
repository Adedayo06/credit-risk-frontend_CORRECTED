import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ScoreResult } from "../api/types";

const STORAGE_KEY = "cr_predictions_v1";

interface PredictionsContextValue {
  predictions: ScoreResult[];
  addPrediction: (result: ScoreResult) => void;
  addPredictions: (results: ScoreResult[]) => void;
  clear: () => void;
}

const PredictionsContext = createContext<PredictionsContextValue | undefined>(undefined);

// main.py's POST /score is stateless — it returns a prediction but never
// stores it. Real prediction history (PRD section 17) needs a backend table
// and GET endpoints; until those exist, this context keeps a running local
// record in localStorage so the dashboard and history page have something
// real to show instead of dummy rows.
export function PredictionsProvider({ children }: { children: React.ReactNode }) {
  const [predictions, setPredictions] = useState<ScoreResult[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ScoreResult[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
    } catch {
      /* storage unavailable — predictions still work for this session */
    }
  }, [predictions]);

  const value = useMemo<PredictionsContextValue>(
    () => ({
      predictions,
      addPrediction: (result) => setPredictions((prev) => [result, ...prev]),
      addPredictions: (results) => setPredictions((prev) => [...results, ...prev]),
      clear: () => setPredictions([]),
    }),
    [predictions]
  );

  return <PredictionsContext.Provider value={value}>{children}</PredictionsContext.Provider>;
}

export function usePredictions() {
  const ctx = useContext(PredictionsContext);
  if (!ctx) throw new Error("usePredictions must be used within PredictionsProvider");
  return ctx;
}
