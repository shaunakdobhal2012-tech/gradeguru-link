import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, Clock, Calendar as CalIcon, Upload, FileUp, Pin, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { assignments, notices, schedule, subjectById, daysUntil } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
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

  const priorityCards = [
    { label: "Overdue", count: overdue.length, tone: "destructive", icon: AlertCircle, hint: "Action needed" },
    { label: "Due today", count: dueToday.length, tone: "warning", icon: Clock, hint: "Finish before midnight" },
    { label: "Due this week", count: dueWeek.length, tone: "primary", icon: CalIcon, hint: "Plan ahead" },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{today}</p>
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting}, {displayName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You have <span className="font-medium text-foreground">{dueToday.length}</span> things due today and{" "}
            <span className="font-medium text-foreground">{notices.filter((n) => !n.read).length}</span> unread notices.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><FileUp className="mr-1.5 h-4 w-4" /> Upload notes</Button>
          <Button size="sm"><Upload className="mr-1.5 h-4 w-4" /> Submit assignment</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {priorityCards.map((c) => (
          <Card key={c.label} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums">{c.count}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.hint}</p>
                </div>
                <div
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl"
                  style={{
                    backgroundColor:
                      c.tone === "destructive" ? "color-mix(in oklab, var(--destructive) 15%, transparent)"
                      : c.tone === "warning" ? "color-mix(in oklab, var(--warning) 25%, transparent)"
                      : "color-mix(in oklab, var(--primary) 14%, transparent)",
                    color:
                      c.tone === "destructive" ? "var(--destructive)"
                      : c.tone === "warning" ? "var(--warning-foreground)"
                      : "var(--primary)",
                  }}
                >
                  <c.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Pin className="h-4 w-4 text-primary" /> Notice board
            </CardTitle>
            <Link to="/messages" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {notices.map((n) => (
              <div
                key={n.id}
                className="flex gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/40"
              >
                <div
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      n.priority === "urgent" ? "var(--destructive)"
                      : n.priority === "important" ? "var(--warning)"
                      : "var(--muted-foreground)",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`truncate text-sm ${n.read ? "font-medium" : "font-semibold"}`}>{n.title}</p>
                    {n.priority === "urgent" && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Urgent</Badge>}
                    {n.priority === "important" && <Badge className="h-5 bg-warning px-1.5 text-[10px] text-warning-foreground hover:bg-warning/90">Important</Badge>}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{n.sender} · {n.timestamp}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Today's schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {schedule.map((s, i) => {
              const isNow = i === 2;
              return (
                <div
                  key={s.time}
                  className={`flex items-center gap-3 rounded-lg px-2.5 py-2 ${isNow ? "bg-primary/8 ring-1 ring-primary/30" : "hover:bg-muted/50"}`}
                  style={isNow ? { backgroundColor: "color-mix(in oklab, var(--primary) 8%, transparent)" } : undefined}
                >
                  <div className="w-12 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">{s.time}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.room} · {s.teacher}</p>
                  </div>
                  {isNow && <Badge className="h-5 bg-primary px-1.5 text-[10px]">Now</Badge>}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> Up next
          </CardTitle>
          <Link to="/assignments" className="text-xs font-medium text-primary hover:underline">All assignments</Link>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {[...dueToday, ...dueWeek].slice(0, 5).map((a) => {
            const sub = subjectById(a.subject);
            const d = daysUntil(a.dueDate);
            return (
              <Link
                key={a.id}
                to="/assignments"
                className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: sub.color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{sub.name}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-medium">
                    {d === 0 ? "Due today" : d === 1 ? "Tomorrow" : `In ${d} days`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{a.dueDate}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
