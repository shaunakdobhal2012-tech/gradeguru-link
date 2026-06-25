import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleAlert as AlertCircle, Clock, Calendar as CalIcon, Upload, FileUp, Pin, ChevronRight, Sparkles, BookOpen, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { assignments, notices, schedule, subjectById, daysUntil } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Scholaria" },
      { name: "description", content: "Your day at a glance: priority deadlines, today's classes and the latest school notices." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, profile } = useAuth();
  const displayName = (profile?.name || user?.name || "there").split(" ")[0];
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const dueToday = assignments.filter((a) => daysUntil(a.dueDate) === 0 && a.status !== "submitted" && a.status !== "graded");
  const dueWeek = assignments.filter((a) => { const d = daysUntil(a.dueDate); return d > 0 && d <= 7; });
  const overdue = assignments.filter((a) => a.status === "overdue");
  const unread = notices.filter((n) => !n.read).length;

  const priorityCards = [
    { label: "Overdue", count: overdue.length, tone: "destructive", icon: AlertCircle, hint: "Action needed immediately" },
    { label: "Due today", count: dueToday.length, tone: "warning", icon: Clock, hint: "Finish before midnight" },
    { label: "Due this week", count: dueWeek.length, tone: "primary", icon: CalIcon, hint: "Plan ahead" },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Hero greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{today}</p>
          <h1 className="mt-1 truncate text-2xl font-bold sm:text-3xl">
            {greeting}, {displayName} 
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            You have{" "}
            <span className="font-semibold text-foreground">{dueToday.length}</span>{" "}
            {dueToday.length === 1 ? "thing" : "things"} due today and{" "}
            <span className="font-semibold text-foreground">{unread}</span> unread{" "}
            {unread === 1 ? "notice" : "notices"}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-full shadow-none">
            <FileUp className="mr-1.5 h-4 w-4" /> Upload notes
          </Button>
          <Button size="sm" className="h-9 rounded-full shadow-sm">
            <Upload className="mr-1.5 h-4 w-4" /> Submit assignment
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {priorityCards.map((c) => {
          const iconBg =
            c.tone === "destructive"
              ? "bg-destructive/10 text-destructive"
              : c.tone === "warning"
              ? "bg-warning/15 text-warning-foreground"
              : "bg-primary/10 text-primary";
          const countColor =
            c.tone === "destructive"
              ? "text-destructive"
              : c.tone === "warning"
              ? "text-warning-foreground"
              : "text-primary";
          return (
            <Card
              key={c.label}
              className="group relative overflow-hidden border-border/60 shadow-[0_1px_3px_0_oklch(0.2_0.04_255/5%)] transition-shadow hover:shadow-[0_4px_12px_0_oklch(0.2_0.04_255/8%)]"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</p>
                    <p className={`mt-2 text-4xl font-bold tabular-nums tracking-tight ${countColor}`}>{c.count}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">{c.hint}</p>
                  </div>
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${iconBg}`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Notice board */}
        <Card className="lg:col-span-2 border-border/60 shadow-[0_1px_3px_0_oklch(0.2_0.04_255/5%)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <Pin className="h-3.5 w-3.5" />
              </div>
              Notice board
              {unread > 0 && (
                <Badge className="h-5 bg-destructive px-1.5 text-[10px] text-destructive-foreground">
                  {unread} new
                </Badge>
              )}
            </CardTitle>
            <Link to="/messages" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {notices.map((n) => {
              const dotColor =
                n.priority === "urgent"
                  ? "bg-destructive"
                  : n.priority === "important"
                  ? "bg-warning"
                  : "bg-muted-foreground/40";
              return (
                <div
                  key={n.id}
                  className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3.5 transition-all duration-150 hover:border-border hover:bg-muted/40 cursor-pointer"
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`truncate text-sm ${n.read ? "font-medium" : "font-semibold"}`}>{n.title}</p>
                      {n.priority === "urgent" && (
                        <Badge variant="destructive" className="h-4.5 px-1.5 text-[10px]">Urgent</Badge>
                      )}
                      {n.priority === "important" && (
                        <Badge className="h-4.5 bg-warning/20 px-1.5 text-[10px] text-warning-foreground hover:bg-warning/20">
                          Important
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">
                      {n.sender} · {n.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Today's schedule */}
        <Card className="border-border/60 shadow-[0_1px_3px_0_oklch(0.2_0.04_255/5%)]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <CalIcon className="h-3.5 w-3.5" />
              </div>
              Today's schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {schedule.map((s, i) => {
              const isNow = i === 2;
              return (
                <div
                  key={s.time}
                  className={`flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors ${
                    isNow
                      ? "bg-primary/8 ring-1 ring-primary/25"
                      : "hover:bg-muted/50"
                  }`}
                  style={isNow ? { backgroundColor: "color-mix(in oklab, var(--primary) 7%, transparent)" } : undefined}
                >
                  <div className="w-12 shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
                    {s.time}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{s.subject}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{s.room}</p>
                  </div>
                  {isNow && (
                    <Badge className="h-4.5 bg-primary px-1.5 text-[10px] text-primary-foreground">Now</Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Up next */}
      <Card className="border-border/60 shadow-[0_1px_3px_0_oklch(0.2_0.04_255/5%)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            Up next
          </CardTitle>
          <Link to="/assignments" className="text-xs font-medium text-primary hover:underline">
            All assignments
          </Link>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="divide-y divide-border/60">
            {[...dueToday, ...dueWeek].slice(0, 5).map((a) => {
              const sub = subjectById(a.subject);
              const d = daysUntil(a.dueDate);
              const dueLabel = d === 0 ? "Due today" : d === 1 ? "Due tomorrow" : `In ${d} days`;
              const dueColor = d === 0 ? "text-destructive" : d <= 2 ? "text-warning-foreground" : "text-muted-foreground";
              return (
                <Link
                  key={a.id}
                  to="/assignments"
                  className="flex items-center gap-3.5 py-3 transition-all hover:bg-muted/30 rounded-lg px-2 -mx-2"
                >
                  <div
                    className="h-9 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: sub.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{sub.name}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className={`text-xs font-semibold ${dueColor}`}>{dueLabel}</p>
                    <p className="text-[11px] text-muted-foreground">{a.dueDate}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 shadow-[0_1px_3px_0_oklch(0.2_0.04_255/5%)]">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-success/10 text-success">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submitted</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-success">
                {assignments.filter((a) => a.status === "submitted").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-[0_1px_3px_0_oklch(0.2_0.04_255/5%)]">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">In progress</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums">
                {assignments.filter((a) => a.status === "in-progress").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-[0_1px_3px_0_oklch(0.2_0.04_255/5%)]">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Graded</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-primary">
                {assignments.filter((a) => a.status === "graded").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
