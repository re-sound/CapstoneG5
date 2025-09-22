import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Role = "admin" | "operador" | "observador";
export type Session = { name: string; role: Role } | null;

type Ctx = {
  session: Session;
  login: (name: string, role: Role) => void;
  logout: () => void;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(null);

  useEffect(() => {
    const raw = localStorage.getItem("atreu_session");
    if (raw) setSession(JSON.parse(raw));
  }, []);

  const value = useMemo<Ctx>(() => ({
    session,
    login: (name, role) => {
      const s: Session = { name, role };
      setSession(s);
      localStorage.setItem("atreu_session", JSON.stringify(s));
    },
    logout: () => {
      setSession(null);
      localStorage.removeItem("atreu_session");
    },
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
