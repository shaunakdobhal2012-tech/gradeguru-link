import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Paperclip, Upload, Filter, Sparkles, Split, Lock } from "lucide-react";
import { toast } from "sonner";
import { assignments, subjects, subjectById, daysUntil, type AssignmentStatus } from "@/lib/mock-data";
import { estimateMinutes, fmtMinutes, setSplit, useSplits } from "@/lib/assignment-estimate";

export const Route = createFileRoute("/assignments")({
  head: () => ({
    meta: [{ title: "Assignments — Scholaria" }, { name: "description", content: "Every assignment across every subject, in one tracker." }],
  }),
  component: AssignmentsPage,
});

const statuses: { id: AssignmentStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "in-progress", label: "In progress" },
  { id: "submitted", label: "Submitted" },
  { id: "graded", label: "Graded" },
  { id: "overdue", label: "Overdue" },
];

const statusStyles: Record<AssignmentStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  "in-progress": "bg-accent text-accent-foreground",
  submitted: "bg-primary/15 text-primary",
  graded: "bg-success/15 text-success",
  overdue: "bg-destructive/15 text-destructive",
};

function AssignmentsPage() {
  const [status, setStatus] = useState<AssignmentStatus | "all">("all");
  const [subject, setSubject] = useState<string>("all");
  const [q, setQ] = useState("");
  const splits = useSplits();

  const filtered = assignments.filter((a) =>
    (status === "all" || a.status === status) &&
    (subject === "all" || a.subject === subject) &&
    a.title.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Assignments</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} of {assignments.length} shown</p>
        </div>
        <Button><Upload className="mr-1.5 h-4 w-4" /> Submit assignment</Button>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {statuses.map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant={status === s.id ? "default" : "outline"}
                onClick={() => setStatus(s.id)}
                className="h-8"
              >
                {s.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={subject === "all" ? "secondary" : "ghost"} onClick={() => setSubject("all")} className="h-8">All subjects</Button>
            {subjects.map((s) => (
              <Button key={s.id} size="sm" variant={subject === s.id ? "secondary" : "ghost"} onClick={() => setSubject(s.id)} className="h-8 gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </Button>
            ))}
          </div>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title…" className="h-9 max-w-sm" />
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((a) => {
          const sub = subjectById(a.subject);
          const d = daysUntil(a.dueDate);
          const isOverdue = a.status === "overdue";
          const est = estimateMinutes(a);
          const parts = splits[a.id];
          return (
            <Card key={a.id} className="group transition-shadow hover:shadow-md">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sub.color }} />
                    {sub.name}
                  </Badge>
                  <Badge className={`${statusStyles[a.status]} capitalize hover:${statusStyles[a.status]}`}>{a.status.replace("-", " ")}</Badge>
                </div>
                <div>
                  <h3 className="font-semibold leading-tight">{a.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="gap-1 cursor-not-allowed font-normal"
                    title={`AI estimate · ${est.type} · auto-calculated`}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span className="font-medium">{fmtMinutes(est.minutes)}</span>
                    <Lock className="h-2.5 w-2.5 opacity-60" />
                  </Badge>
                  {parts ? (
                    <Badge
                      variant="outline"
                      className="gap-1 cursor-pointer"
                      style={{ borderStyle: "dotted", borderColor: sub.color, color: sub.color }}
                      onClick={() => {
                        setSplit(a.id, null);
                        toast(`Merged ${a.title} back into one block.`);
                      }}
                      title="Click to undo split"
                    >
                      <Split className="h-3 w-3" /> {parts}× {fmtMinutes(Math.round(est.minutes / parts))}
                    </Badge>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs">
                          <Split className="h-3 w-3" /> Split
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="mb-1.5 text-[11px] text-muted-foreground">Sessions</div>
                        <div className="flex gap-1">
                          {[2, 3, 4, 5].map((n) => (
                            <Button
                              key={n}
                              size="sm"
                              variant="outline"
                              className="h-7 w-9 px-0 text-xs"
                              onClick={() => {
                                setSplit(a.id, n);
                                toast.success(
                                  `Split into ${n} parts · ~${fmtMinutes(Math.round(est.minutes / n))} each`,
                                );
                              }}
                            >
                              {n}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                  <div className={isOverdue ? "font-medium text-destructive" : "text-muted-foreground"}>
                    {a.status === "graded" ? <span>Grade: <span className="font-semibold text-success">{a.grade}</span></span>
                      : isOverdue ? `Overdue · ${a.dueDate}`
                      : d === 0 ? "Due today"
                      : d < 0 ? `Late by ${-d}d`
                      : `Due in ${d}d · ${a.dueDate}`}
                  </div>
                  <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <Paperclip className="h-3.5 w-3.5" /> 2
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
