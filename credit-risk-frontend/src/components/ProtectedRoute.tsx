import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../api/types";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface Props {
  children: React.ReactNode;
  allow?: Role[];
}

export default function ProtectedRoute({ children, allow }: Props) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopBar />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
