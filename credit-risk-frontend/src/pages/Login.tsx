import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Role } from "../api/types";
import "./Login.css";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("analyst");
  const [error, setError] = useState("");

  if (user) return <Navigate to="/dashboard" replace />;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Enter an email and password to continue.");
      return;
    }
    setError("");
    login(email.trim(), role);
    navigate("/dashboard");
  }

  return (
    <div className="login-screen">
      <div className="login-panel">
        <div className="login-brand">
          <span className="sidebar-mark login-mark">CR</span>
          <div>
            <div className="login-brand-name">Credit Risk</div>
            <div className="login-brand-sub">Scoring &amp; Prediction</div>
          </div>
        </div>

        <h1 className="login-title">Sign in to your workspace</h1>
        <p className="login-copy">
          Score applicants, monitor drift, and manage analysts &mdash; all from one console
          built on the Random Forest default-risk model.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="role-toggle">
            {(["analyst", "admin"] as Role[]).map((r) => (
              <button
                type="button"
                key={r}
                className={"role-toggle-btn" + (role === r ? " active" : "")}
                onClick={() => setRole(r)}
              >
                {r === "analyst" ? "Analyst" : "Administrator"}
              </button>
            ))}
          </div>

          <div className="field">
            <label htmlFor="email">Work email</label>
            <input
              id="email"
              type="email"
              placeholder="you@bank.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn btn-amber login-submit">
            Sign in as {role === "analyst" ? "analyst" : "administrator"}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="login-footnote">
          <ShieldCheck size={13} />
          Authenticated sessions are role-scoped. This demo accepts any credentials
          &mdash; wire up to your FastAPI auth endpoint for production use.
        </div>
      </div>

      <div className="login-side" aria-hidden="true">
        <div className="login-side-inner">
          <h2 className="login-hero">
            {"Credit Risk Scoring System".split(" ").map((word, wi) => (
              <span className="login-hero-word" key={wi}>
                {word.split("").map((ch, ci) => (
                  <span
                    className="login-hero-char"
                    key={ci}
                    style={{ animationDelay: `${(wi * 6 + ci) * 0.06}s` }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            ))}
          </h2>
          <div className="login-hero-line" />
        </div>
      </div>
    </div>
  );
}
