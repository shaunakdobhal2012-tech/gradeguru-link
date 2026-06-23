import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2, Lock, Mail, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, type UserRole } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Scholaria" },
      { name: "description", content: "Sign in to your Scholaria academic dashboard." },
    ],
  }),
  component: LoginPage,
});

const ROLES: { value: UserRole; label: string; hint: string }[] = [
  { value: "student", label: "Student", hint: "Track assignments & grades" },
  { value: "teacher", label: "Teacher", hint: "Post notices & resources" },
  { value: "parent", label: "Parent", hint: "View-only access" },
];

function LoginPage() {
  const { login, isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && isAuthenticated) navigate({ to: "/" });
  }, [isReady, isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setSubmitting(true);
    try {
      await login({ email, password, role, remember });
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-accent/40 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>
        <div className="relative flex items-center gap-2 text-lg font-semibold">
          <GraduationCap className="h-6 w-6" />
          Scholaria
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight">Everything academic, in one calm place.</h1>
          <p className="max-w-md text-primary-foreground/80">
            Assignments, notices, schedules and study materials — unified so students can focus on learning, not searching.
          </p>
          <ul className="space-y-3 text-sm text-primary-foreground/90">
            <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4" /> Role-based access for students, teachers and parents</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4" /> Deadline tracking that actually reduces stress</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4" /> One inbox for every classroom announcement</li>
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/60">© 2026 Scholaria School Network</p>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Scholaria</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your dashboard to continue.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label>I am signing in as</Label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => {
                  const active = role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`rounded-lg border px-3 py-2.5 text-left transition ${
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-foreground/30"
                      }`}
                      aria-pressed={active}
                    >
                      <div className="text-sm font-medium">{r.label}</div>
                      <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{r.hint}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@school.edu"
                  className="h-11 pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 pl-9 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
              <Label htmlFor="remember" className="cursor-pointer text-sm font-normal text-muted-foreground">
                Keep me signed in on this device
              </Label>
            </div>

            {error && (
              <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="h-11 w-full" disabled={submitting}>
              {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>) : "Sign in"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Demo login — any valid-looking email and a 6+ character password will work.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
