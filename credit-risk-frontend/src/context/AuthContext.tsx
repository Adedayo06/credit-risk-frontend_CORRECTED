import React, { createContext, useContext, useMemo, useState } from "react";
import { AuthUser, Role } from "../api/types";

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Mock authentication for the demo. Swap `login` to call a real
// POST /auth/login endpoint against the FastAPI backend and store the
// returned JWT once authentication is implemented server-side.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: (email: string, role: Role) => {
        const name = email
          .split("@")[0]
          .split(/[._]/)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" ");
        setUser({ id: `u-${role}`, name: name || (role === "admin" ? "Administrator" : "Analyst"), email, role });
      },
      logout: () => setUser(null),
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
