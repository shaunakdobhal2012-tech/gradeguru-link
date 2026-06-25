import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, GraduationCap, Loader as Loader2, Lock, Mail, ShieldCheck, User as UserIcon, BookOpen, Calendar, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth, type UserRole } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Scholaria" },
      { name: "description", content: "Sign in or create your Scholaria academic dashboard account." },
    ],
  }),
  component: LoginPage,
});

const ROLES: { value: UserRole; label: string; hint: string }[] = [
  { value: "student", label: "Student", hint: "Track assignments" },
  { value: "teacher", label: "Teacher", hint: "Post notices" },
  { value: "parent", label: "Parent", hint: "View-only" },
];

const FEATURE_PILLS = [
  { icon: ShieldCheck, label: "Role-based access" },
  { icon: Calendar, label: "Smart deadlines" },
  { icon: Bell, label: "Unified inbox" },
  { icon: BookOpen, label: "Resource library" },
];

function LoginPage() {
  const { isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    if (isReady && isAuthenticated) navigate({ to: "/dashboard" });
  }, [isReady, isAuthenticated, navigate]);

  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-[1fr_0.9fr]">
      {/* Left panel */}
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-14"
        style={{
          background: "linear-gradient(135deg, oklch(0.38 0.15 258) 0%, oklch(0.52 0.17 258) 55%, oklch(0.58 0.19 222) 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-16 right-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/3 blur-2xl" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Scholaria</span>
        </div>

        <div className="relative space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white">
              Everything<br />academic,<br />one place.
            </h1>
            <p className="max-w-xs text-base text-white/75 leading-relaxed">
              Assignments, notices, schedules and study materials — unified so students focus on learning, not searching.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FEATURE_PILLS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5 text-white/80" />
                <span className="text-xs font-medium text-white/90">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">© 2026 Scholaria School Network</p>
      </aside>

      {/* Right panel */}
      <section className="flex items-center justify-center bg-background px-6 py-12 sm:px-10">
        <div className="w-full max-w-[22rem]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">Scholaria</span>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 rounded-full border border-border/60 bg-muted/50 p-1">
              <TabsTrigger value="signin" className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Create account
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-7">
              <SignInForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-7">
              <SignUpForm onDone={() => setTab("signin")} />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

function SignInForm() {
  const { signIn, sendPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn({ email, password });
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotSubmitting(true);
    try {
      await sendPasswordReset(forgotEmail);
      toast.success("Reset email sent. Check your inbox.");
      setForgotOpen(false);
      setForgotEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setForgotSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-7 space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Sign in to your dashboard to continue.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="signin-email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="signin-email" type="email" autoComplete="email" placeholder="you@school.edu"
              className="h-11 rounded-xl pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="signin-password">Password</Label>
            <button type="button" onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
              className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="signin-password" type={showPw ? "text" : "password"} autoComplete="current-password"
              placeholder="••••••••" className="h-11 rounded-xl pl-10 pr-11" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="mt-2 h-11 w-full rounded-xl text-sm font-semibold shadow-sm" disabled={submitting}>
          {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>) : "Sign in"}
        </Button>
      </form>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="rounded-2xl">
          <form onSubmit={handleForgot}>
            <DialogHeader>
              <DialogTitle>Reset your password</DialogTitle>
              <DialogDescription>
                Enter the email tied to your account and we'll send you a reset link.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input id="forgot-email" type="email" required value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@school.edu"
                className="h-11 rounded-xl" />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={forgotSubmitting}>
                {forgotSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>) : "Send reset link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SignUpForm({ onDone }: { onDone: () => void }) {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [grade, setGrade] = useState("");
  const [age, setAge] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    const ageNum = age ? Number(age) : undefined;
    if (ageNum !== undefined && (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 129)) {
      toast.error("Enter a valid age."); return;
    }
    setSubmitting(true);
    try {
      const { needsEmailConfirmation } = await signUp({
        email, password, name, role,
        grade: grade.trim() || undefined,
        age: ageNum,
      });
      if (needsEmailConfirmation) {
        toast.success("Account created. Check your email to confirm your address.");
        onDone();
      } else {
        toast.success("Welcome to Scholaria!");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-7 space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
        <p className="text-sm text-muted-foreground">Join your school's academic dashboard.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>I am joining as</Label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => {
              const active = role === r.value;
              return (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition-all duration-150 ${
                    active
                      ? "border-primary bg-primary/8 shadow-sm ring-1 ring-primary"
                      : "border-border hover:border-border/80 hover:bg-muted/50"
                  }`}
                  style={active ? { backgroundColor: "color-mix(in oklab, var(--primary) 8%, transparent)" } : undefined}
                  aria-pressed={active}>
                  <div className="text-sm font-semibold">{r.label}</div>
                  <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{r.hint}</div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-name">Full name</Label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="signup-name" autoComplete="name" required value={name}
              onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl pl-10" placeholder="Alex Okafor" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="signup-email" type="email" autoComplete="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl pl-10" placeholder="you@school.edu" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="signup-grade">Grade / class</Label>
            <Input id="signup-grade" value={grade} onChange={(e) => setGrade(e.target.value)}
              className="h-11 rounded-xl" placeholder="e.g. Grade 11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signup-age">Age</Label>
            <Input id="signup-age" type="number" min={1} max={129} value={age}
              onChange={(e) => setAge(e.target.value)} className="h-11 rounded-xl" placeholder="16" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="signup-password" type={showPw ? "text" : "password"} autoComplete="new-password"
              required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl pl-10 pr-11" placeholder="At least 6 characters" />
            <button type="button" onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="mt-2 h-11 w-full rounded-xl text-sm font-semibold shadow-sm" disabled={submitting}>
          {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</>) : "Create account"}
        </Button>
      </form>
    </>
  );
}
