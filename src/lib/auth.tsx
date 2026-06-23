import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "student" | "teacher" | "parent";

export type Profile = {
  id: string;
  name: string;
  email: string;
  grade: string | null;
  age: number | null;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  initials: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isReady: boolean;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    grade?: string;
    age?: number;
  }) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, "name" | "grade" | "age">>) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function initialsFrom(name: string, email: string) {
  const base = (name && name.trim()) || email.split("@")[0].replace(/[._-]+/g, " ");
  const parts = base.split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "S") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "");
  return letters.toUpperCase();
}

function toAuthUser(u: User | null | undefined, profileName?: string | null): AuthUser | null {
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as { name?: string; full_name?: string; role?: UserRole };
  const name = profileName || meta.name || meta.full_name || (u.email?.split("@")[0] ?? "User");
  const role: UserRole = meta.role === "teacher" || meta.role === "parent" ? meta.role : "student";
  return { id: u.id, email: u.email ?? "", name, role, initials: initialsFrom(name, u.email ?? "") };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isReady, setIsReady] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, grade, age")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("Failed to load profile", error);
      return;
    }
    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        // Defer DB call to avoid potential auth deadlock
        setTimeout(() => { void loadProfile(s.user.id); }, 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void loadProfile(data.session.user.id);
      setIsReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const user = useMemo(() => toAuthUser(session?.user, profile?.name), [session, profile]);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async ({ email, password, name, role, grade, age }: {
      email: string; password: string; name: string; role: UserRole; grade?: string; age?: number;
    }) => {
      const redirect = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            ...(grade ? { grade } : {}),
            ...(typeof age === "number" ? { age: String(age) } : {}),
          },
          emailRedirectTo: redirect,
        },
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

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(async (patch) => {
    if (!session?.user) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", session.user.id)
      .select("id, name, email, grade, age")
      .single();
    if (error) throw error;
    setProfile(data as Profile);
  }, [session]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      session,
      isAuthenticated: !!session,
      isReady,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      updateProfile,
      refreshProfile,
    }),
    [user, profile, session, isReady, signIn, signUp, signOut, sendPasswordReset, updatePassword, updateProfile, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
