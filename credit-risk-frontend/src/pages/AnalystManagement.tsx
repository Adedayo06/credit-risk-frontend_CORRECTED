import React, { useState } from "react";
import { Ban, CheckCircle2, Plus, UserPlus } from "lucide-react";
import { Analyst } from "../api/types";
import "./AnalystManagement.css";

export default function AnalystManagement() {
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function toggleStatus(id: string) {
    setAnalysts((list) =>
      list.map((a) =>
        a.id === id ? { ...a, status: a.status === "active" ? "suspended" : "active" } : a
      )
    );
  }

  function addAnalyst(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const newAnalyst: Analyst = {
      id: `a-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      email: email.trim(),
      status: "active",
      role: "analyst",
      joinedAt: new Date().toISOString().slice(0, 10),
      predictionsThisMonth: 0,
    };
    setAnalysts((list) => [newAnalyst, ...list]);
    setName("");
    setEmail("");
    setShowForm(false);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Administrator</span>
          <h1 className="page-title">Manage analysts</h1>
          <p className="page-subtitle">
            Add analysts, and suspend access for accounts that shouldn&rsquo;t be scoring
            right now.
          </p>
        </div>
        <button className="btn btn-amber" onClick={() => setShowForm((s) => !s)}>
          <UserPlus size={16} />
          Add analyst
        </button>
      </div>

      {showForm && (
        <form className="card card-pad analyst-form" onSubmit={addAnalyst}>
          <div className="field">
            <label htmlFor="a-name">Full name</label>
            <input id="a-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="a-email">Work email</label>
            <input
              id="a-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            <Plus size={15} />
            Create account
          </button>
        </form>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Analyst</th>
              <th>Email</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Predictions this month</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {analysts.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <h3>No analysts yet</h3>
                    <p>Use &ldquo;Add analyst&rdquo; above to create the first account.</p>
                  </div>
                </td>
              </tr>
            )}
            {analysts.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td className="mono">{a.email}</td>
                  <td>
                    <span className={"status-pill status-" + a.status}>{a.status}</span>
                  </td>
                  <td>{new Date(a.joinedAt).toLocaleDateString()}</td>
                  <td className="mono">{a.predictionsThisMonth}</td>
                  <td>
                    <button className="btn btn-ghost analyst-toggle" onClick={() => toggleStatus(a.id)}>
                      {a.status === "active" ? (
                        <>
                          <Ban size={14} /> Suspend
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} /> Reactivate
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
