import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PredictionsProvider } from "./context/PredictionsContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import AnalystDashboard from "./pages/AnalystDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import IndividualScoring from "./pages/IndividualScoring";
import BatchScoring from "./pages/BatchScoring";
import PredictionHistory from "./pages/PredictionHistory";
import AnalystManagement from "./pages/AnalystManagement";
import ModelPerformancePage from "./pages/ModelPerformancePage";
import ModelDrift from "./pages/ModelDrift";

function DashboardGate() {
  const { user } = useAuth();
  return user?.role === "admin" ? <AdminDashboard /> : <AnalystDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <PredictionsProvider>
        <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardGate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/scoring/individual"
          element={
            <ProtectedRoute allow={["analyst"]}>
              <IndividualScoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scoring/batch"
          element={
            <ProtectedRoute allow={["analyst"]}>
              <BatchScoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute allow={["analyst"]}>
              <PredictionHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analysts"
          element={
            <ProtectedRoute allow={["admin"]}>
              <AnalystManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/performance"
          element={
            <ProtectedRoute allow={["admin"]}>
              <ModelPerformancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/drift"
          element={
            <ProtectedRoute allow={["admin"]}>
              <ModelDrift />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </PredictionsProvider>
    </AuthProvider>
  );
}
