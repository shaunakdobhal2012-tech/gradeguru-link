import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  AlertTriangle,
  Layers,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Clock,
  Bell,
  Calendar,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Scholaria — One calm hub for school" },
      {
        name: "description",
        content:
          "Scholaria unifies assignments, notices, schedules and resources into one priority-aware dashboard. Stop searching, start learning.",
      },
      { property: "og:title", content: "Scholaria — One calm hub for school" },
      {
        property: "og:description",
        content:
          "A unified student dashboard that turns scattered school chaos into calm clarity.",
      },
    ],
  }),
  component: LandingPage,
});

const SECTIONS = [
  { id: "problem", label: "The Problem" },
  { id: "causes", label: "Effects & Causes" },
  { id: "solution", label: "The Solution" },
];

function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState("problem");
  const [menuOpen, setMenuOpen] = useState(false);
  const ctaTarget = isAuthenticated ? "/dashboard" : "/login";
  const ctaLabel = isAuthenticated ? "Open your dashboard" : "Get Started Free";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Nav */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-border/60 bg-background/80 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex min-w-0 items-center gap-2"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="truncate text-base font-semibold tracking-tight">Scholaria</span>
          </button>

          <div className="hidden items-center gap-1 md:flex">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeId === s.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
                {activeId === s.id && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-block"
            >
              Log in
            </Link>
            <Button asChild size="sm" className="shadow-sm">
              <Link to={ctaTarget}>{ctaLabel}</Link>
            </Button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-md border border-border md:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </nav>
        {menuOpen && (
          <div className="border-t border-border/60 bg-background md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-muted"
                >
                  {s.label}
                </button>
              ))}
              <Link
                to="/login"
                className="rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-muted"
              >
                Log in
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Built for students who are tired of switching tabs
          </div>
          <h1 className="animate-fade-in text-4xl font-bold tracking-tight sm:text-6xl">
            School, finally <span className="text-primary">in one place</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-fade-in text-lg text-muted-foreground sm:text-xl">
            Scholaria turns the chaos of WhatsApp pings, classroom links and forgotten portals into a
            single, calm hub — so you always know what's due and where to focus.
          </p>
          <div className="mt-8 flex animate-fade-in flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="hover-scale shadow-md">
              <Link to={ctaTarget}>
                {ctaLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="lg" onClick={() => scrollTo("problem")}>
              See how it works
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free for students · No credit card · Setup in under a minute
          </p>
        </div>
      </section>

      {/* Problem */}
      <Section
        id="problem"
        eyebrow="The Problem"
        title="School information lives everywhere — except where you need it."
        intro="Students lose hours every week hunting for assignments, notices and deadlines across WhatsApp groups, Google Classroom, school portals and email threads. The work isn't the hard part. Finding the work is."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Bell, label: "WhatsApp pings", body: "Important updates buried under memes and side-chats." },
            { icon: BookOpen, label: "Google Classroom", body: "Per-subject silos with no shared timeline." },
            { icon: Layers, label: "School portals", body: "Slow logins, scattered PDFs, broken links." },
            { icon: Clock, label: "Email threads", body: "Deadline reminders lost in promotional noise." },
          ].map((c) => (
            <div
              key={c.label}
              className="group rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-destructive/40 hover:shadow-lg"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-destructive/10 text-destructive">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold">{c.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <p className="text-base leading-relaxed sm:text-lg">
              The result is missed deadlines, broken focus and a constant, low-grade panic that school is
              about to surprise you — again.
            </p>
          </div>
        </div>
      </Section>

      {/* Causes */}
      <Section
        id="causes"
        eyebrow="The Effects & Causes"
        title="The real problem isn't you. It's fragmented edtech."
        intro="The average school uses 60+ disconnected tools. Each one solves a slice of the problem and pushes the integration work onto students. The cost compounds: every minute spent searching is a minute not spent learning — and it hits at-risk students hardest."
        tone="warning"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { stat: "60+", label: "Disconnected tools", body: "Average platforms used across a single school year." },
            { stat: "7 hrs", label: "Lost per week", body: "Time students spend hunting for information they already have access to." },
            { stat: "1 in 3", label: "Missed deadlines", body: "Submissions slip not from lack of effort — but lack of visibility." },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-4xl font-bold text-primary">{c.stat}</p>
              <p className="mt-2 text-sm font-semibold">{c.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Root cause
            </h3>
            <p className="mt-2 text-lg font-medium leading-snug">
              Schools buy tools. Students inherit the integration work.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Every platform was designed in isolation. None of them know about each other — so the only
              place they finally connect is inside a stressed student's head.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              The compounding cost
            </h3>
            <p className="mt-2 text-lg font-medium leading-snug">
              Lost productivity. Lower grades. Quiet, daily stress.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              The students who can least afford to lose time — those juggling jobs, family, or learning
              differences — feel it first and feel it worst.
            </p>
          </div>
        </div>
      </Section>

      {/* Solution */}
      <Section
        id="solution"
        eyebrow="The Solution"
        title="One calm hub. Everything that matters, in priority order."
        intro="Scholaria aggregates assignments, notices, schedules and syllabus-relevant resources from across your school's tools — then surfaces what's due, what's urgent and what's next. No more digging. Just clarity."
        tone="primary"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Clock, label: "Priority-aware", body: "Overdue, due today, due this week — sorted by what actually matters now." },
            { icon: Calendar, label: "Unified schedule", body: "Classes, exams and deadlines on a single timeline you can trust." },
            { icon: BookOpen, label: "Resources that fit", body: "Study materials linked to your syllabus, not a generic library." },
            { icon: Bell, label: "Calm notifications", body: "One quiet inbox for school notices — no group chat noise." },
          ].map((c) => (
            <div
              key={c.label}
              className="group rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold">{c.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>

        <ul className="mt-10 grid gap-3 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2 sm:p-8">
          {[
            "Know exactly what's due — without opening five apps",
            "See the urgent stuff first, every single time",
            "Catch notices the moment they're posted",
            "Spend your energy learning, not searching",
          ].map((line) => (
            <li key={line} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm sm:text-base">{line}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Final CTA */}
      <section className="px-6 pb-24">
        <div
          className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-primary/20 p-10 text-center sm:p-16"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--primary) 12%, var(--background)), color-mix(in oklab, var(--primary) 4%, var(--background)))",
          }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            School is stressful enough.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Let Scholaria handle the chaos so you can focus on what you actually came to do — learn.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="hover-scale shadow-md">
              <Link to={ctaTarget}>
                {ctaLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">I already have an account</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span>© {new Date().getFullYear()} Scholaria</span>
          </div>
          <div>Made for students who'd rather be learning.</div>
        </div>
      </footer>
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  intro,
  tone = "default",
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  tone?: "default" | "primary" | "warning";
  children: React.ReactNode;
}) {
  const toneClasses =
    tone === "primary"
      ? "text-primary"
      : tone === "warning"
      ? "text-destructive"
      : "text-muted-foreground";
  return (
    <section id={id} className="scroll-mt-24 px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className={`text-xs font-semibold uppercase tracking-[0.18em] ${toneClasses}`}
          >
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {intro}
          </p>
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
