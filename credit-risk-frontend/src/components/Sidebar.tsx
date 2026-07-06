import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UserSearch,
  FileStack,
  Users,
  ActivitySquare,
  History,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const analystLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scoring/individual", label: "Individual scoring", icon: UserSearch },
  { to: "/scoring/batch", label: "Batch scoring", icon: FileStack },
  { to: "/history", label: "Prediction history", icon: History },
];

const adminLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/analysts", label: "Manage analysts", icon: Users },
  { to: "/admin/performance", label: "Model performance", icon: ActivitySquare },
  { to: "/admin/drift", label: "Model drift (PSI)", icon: ShieldCheck },
];

export default function Sidebar() {
  const { user } = useAuth();
  const links = user?.role === "admin" ? adminLinks : analystLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-mark">CR</span>
        <div>
          <div className="sidebar-brand-name">Credit Risk</div>
          <div className="sidebar-brand-sub">Scoring &amp; Prediction</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
          >
            <Icon size={17} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
