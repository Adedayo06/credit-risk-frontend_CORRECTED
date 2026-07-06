import React from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./TopBar.css";

export default function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-role">
        {user?.role === "admin" ? "Administrator console" : "Analyst workspace"}
      </div>
      <div className="topbar-user">
        <div className="topbar-avatar">{initials(user?.name ?? "?")}</div>
        <div className="topbar-user-text">
          <div className="topbar-user-name">{user?.name}</div>
          <div className="topbar-user-email">{user?.email}</div>
        </div>
        <button className="btn btn-ghost topbar-logout" onClick={logout}>
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </header>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
