import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "student" | "teacher" | "parent";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  initials: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isReady: boolean;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: { email: string; password: string; name: string; role: UserRole }) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function initialsFrom(name: string, email: string) {
  const base = (name && name.trim()) || email.split("@")[0].replace(/[._-]+/g, " ");
  const parts = base.split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "S") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "");
  return letters.toUpperCase();
}

function toAuthUser(u: User | null | undefined): AuthUser | null {
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as { name?: string; full_name?: string; role?: UserRole };
  const name = meta.name || meta.full_name || (u.email?.split("@")[0] ?? "User");
  const role: UserRole = meta.role === "teacher" || meta.role === "parent" ? meta.role : "student";
  return { id: u.id, email: u.email ?? "", name, role, initials: initialsFrom(name, u.email ?? "") };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Register listener FIRST, then read existing session
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(toAuthUser(s?.user));
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(toAuthUser(data.session?.user));
      setIsReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async ({ email, password, name, role }: { email: string; password: string; name: string; role: UserRole }) => {
      const redirect = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role }, emailRedirectTo: redirect },
      });
      if (error) throw error;
      return { needsEmailConfirmation: !data.session };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const redirect = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirect });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isAuthenticated: !!session,
      isReady,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
    }),
    [user, session, isReady, signIn, signUp, signOut, sendPasswordReset, updatePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
