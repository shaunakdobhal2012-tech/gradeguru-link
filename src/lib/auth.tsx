import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type UserRole = "student" | "teacher" | "parent";

export type AuthUser = {
  name: string;
  email: string;
  role: UserRole;
  initials: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (input: { email: string; password: string; role: UserRole; remember: boolean }) => Promise<AuthUser>;
  logout: () => void;
};

const STORAGE_KEY = "scholaria.auth.user";
const AuthContext = createContext<AuthContextValue | null>(null);

function initialsFromEmail(email: string) {
  const name = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "S") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "");
  return letters.toUpperCase();
}

function readStored(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setUser(readStored());
    setIsReady(true);
  }, []);

  const login = useCallback<AuthContextValue["login"]>(async ({ email, password, role, remember }) => {
    await new Promise((r) => setTimeout(r, 450));
    if (!email || !password) throw new Error("Email and password are required.");
    const name = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const next: AuthUser = { name, email, role, initials: initialsFromEmail(email) };
    const store = remember ? window.localStorage : window.sessionStorage;
    store.setItem(STORAGE_KEY, JSON.stringify(next));
    (remember ? window.sessionStorage : window.localStorage).removeItem(STORAGE_KEY);
    setUser(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
