import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, Clock, Calendar as CalIcon, Plus, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssignments, derivedStatus } from "@/lib/assignments";
import { subjectColor } from "@/lib/subjects";
import { AssignmentDialog } from "@/components/assignment-dialog";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Scholaria" },
      { name: "description", content: "Your day at a glance: priority deadlines and today's schedule." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, profile } = useAuth();
  const { data: assignments = [], isLoading } = useAssignments();
  const displayName = (profile?.name || user?.name || "there").split(" ")[0];
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 86400000);

  const overdue = assignments.filter((a) => derivedStatus(a) === "overdue");
  const dueToday = assignments.filter((a) => {
    const d = new Date(a.due_date);
    return d >= startOfToday && d < endOfToday && a.status !== "submitted" && a.status !== "graded";
  });
  const dueWeek = assignments.filter((a) => {
    const d = new Date(a.due_date);
    return d >= endOfToday && d <= endOfWeek && a.status !== "submitted" && a.status !== "graded";
  });

  const priorityCards = [
    { label: "Overdue", count: overdue.length, tone: "destructive", icon: AlertCircle, hint: "Action needed" },
    { label: "Due today", count: dueToday.length, tone: "warning", icon: Clock, hint: "Finish before midnight" },
    { label: "Due this week", count: dueWeek.length, tone: "primary", icon: CalIcon, hint: "Plan ahead" },
  ] as const;

  const upcoming = [...dueToday, ...dueWeek].slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{today}</p>
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting}, {displayName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You have <span className="font-medium text-foreground">{dueToday.length}</span> due today and{" "}
            <span className="font-medium text-foreground">{overdue.length}</span> overdue.
          </p>
        </div>
        <div className="flex gap-2">
          <AssignmentDialog trigger={<Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> New assignment</Button>} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {priorityCards.map((c) => (
          <Card key={c.label} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums">{isLoading ? "—" : c.count}</p>
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> Up next
          </CardTitle>
          <Link to="/assignments" className="text-xs font-medium text-primary hover:underline">All assignments</Link>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {isLoading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nothing due in the next week — nice.
            </div>
          ) : upcoming.map((a) => {
            const color = subjectColor(a.subject);
            const dueMs = new Date(a.due_date).getTime() - Date.now();
            const dueDays = Math.ceil(dueMs / 86400000);
            return (
              <Link key={a.id} to="/assignments"
                className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40">
                <div className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.subject}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-medium">
                    {dueDays <= 0 ? "Due today" : dueDays === 1 ? "Tomorrow" : `In ${dueDays} days`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(a.due_date).toLocaleDateString()}
                  </p>
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
