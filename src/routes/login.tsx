import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
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

function LoginPage() {
  const { isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    if (isReady && isAuthenticated) navigate({ to: "/dashboard" });
  }, [isReady, isAuthenticated, navigate]);

  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-2">
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

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Scholaria</span>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6">
              <SignInForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
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
      const msg = err instanceof Error ? err.message : "Sign in failed";
      toast.error(msg);
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
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your dashboard to continue.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="signin-email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="signin-email" type="email" autoComplete="email" placeholder="you@school.edu"
              className="h-11 pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="signin-password">Password</Label>
            <button type="button" onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
              className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="signin-password" type={showPw ? "text" : "password"} autoComplete="current-password"
              placeholder="••••••••" className="h-11 pl-9 pr-10" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPw((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="h-11 w-full" disabled={submitting}>
          {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>) : "Sign in"}
        </Button>
      </form>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
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
                onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@school.edu" />
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
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">Join your school's academic dashboard.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>I am joining as</Label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => {
              const active = role === r.value;
              return (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition ${
                    active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-foreground/30"
                  }`} aria-pressed={active}>
                  <div className="text-sm font-medium">{r.label}</div>
                  <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{r.hint}</div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-name">Full name</Label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="signup-name" autoComplete="name" required value={name}
              onChange={(e) => setName(e.target.value)} className="h-11 pl-9" placeholder="Alex Okafor" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="signup-email" type="email" autoComplete="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} className="h-11 pl-9" placeholder="you@school.edu" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="signup-grade">Grade / class</Label>
            <Input id="signup-grade" value={grade} onChange={(e) => setGrade(e.target.value)}
              className="h-11" placeholder="e.g. Grade 11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-age">Age</Label>
            <Input id="signup-age" type="number" min={1} max={129} value={age}
              onChange={(e) => setAge(e.target.value)} className="h-11" placeholder="16" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="signup-password" type={showPw ? "text" : "password"} autoComplete="new-password"
              required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="h-11 pl-9 pr-10" placeholder="At least 6 characters" />
            <button type="button" onClick={() => setShowPw((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="h-11 w-full" disabled={submitting}>
          {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</>) : "Create account"}
        </Button>
      </form>
    </>
  );
}
