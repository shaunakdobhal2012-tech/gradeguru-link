import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Paperclip,
  Plus,
  Clock,
  Scissors,
  Sparkles,
  Search,
} from "lucide-react";
import {
  subjects,
  subjectById,
  daysUntil,
  type AssignmentStatus,
} from "@/lib/mock-data";
import {
  assignmentsStore,
  useAssignmentsStore,
} from "@/lib/assignments-store";
import { estimateMinutes } from "@/lib/estimate";
import { toast } from "sonner";

export const Route = createFileRoute("/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — Scholaria" },
      {
        name: "description",
        content: "Every assignment across every subject, in one tracker.",
      },
    ],
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

const statusConfig: Record<AssignmentStatus, { bg: string; text: string; dot: string }> = {
  pending:       { bg: "bg-muted",          text: "text-muted-foreground", dot: "bg-muted-foreground/50" },
  "in-progress": { bg: "bg-primary/10",     text: "text-primary",          dot: "bg-primary" },
  submitted:     { bg: "bg-success/12",     text: "text-success",          dot: "bg-success" },
  graded:        { bg: "bg-success/12",     text: "text-success",          dot: "bg-success" },
  overdue:       { bg: "bg-destructive/10", text: "text-destructive",      dot: "bg-destructive" },
};

function AssignmentsPage() {
  const { assignments } = useAssignmentsStore();
  const [status, setStatus] = useState<AssignmentStatus | "all">("all");
  const [subject, setSubject] = useState<string>("all");
  const [q, setQ] = useState("");

  const filtered = assignments.filter(
    (a) =>
      (status === "all" || a.status === status) &&
      (subject === "all" || a.subject === subject) &&
      a.title.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Assignments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} of {assignments.length} shown
          </p>
        </div>
        <NewAssignmentDialog />
      </div>

      {/* Filter bar */}
      <Card className="border-border/60 shadow-[0_1px_3px_0_oklch(0.2_0.04_255/5%)]">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {statuses.map((s) => (
              <button
                key={s.id}
                onClick={() => setStatus(s.id)}
                className={`h-8 rounded-full px-3.5 text-xs font-medium transition-all duration-150 ${
                  status === s.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSubject("all")}
              className={`h-7 rounded-full px-3 text-xs font-medium transition-all ${
                subject === "all"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All subjects
            </button>
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSubject(s.id)}
                className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-all ${
                  subject === s.id
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </button>
            ))}
          </div>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search assignments…"
              className="h-9 rounded-full border-border/60 bg-muted/40 pl-8 text-sm placeholder:text-muted-foreground/60"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((a) => {
          const sub = subjectById(a.subject);
          const d = daysUntil(a.dueDate);
          const isOverdue = a.status === "overdue";
          const cfg = statusConfig[a.status];

          return (
            <Card
              key={a.id}
              className="group flex flex-col overflow-hidden border-border/60 shadow-[0_1px_3px_0_oklch(0.2_0.04_255/5%)] transition-all duration-200 hover:shadow-[0_4px_12px_0_oklch(0.2_0.04_255/8%)] hover:-translate-y-0.5"
            >
              {/* Subject accent bar */}
              <div className="h-1 w-full shrink-0" style={{ backgroundColor: sub.color }} />
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: sub.color }} />
                    <span className="text-xs font-semibold text-muted-foreground">{sub.name}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${cfg.bg} ${cfg.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {a.status.replace("-", " ")}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold leading-tight">{a.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                    {a.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <EstimateEditor
                      value={a.estimateMin}
                      onCommit={(m) => assignmentsStore.updateEstimate(a.id, m)}
                    />
                    <span>min</span>
                    {!a.splitManual && (
                      <Sparkles className="h-2.5 w-2.5 text-primary ml-0.5 opacity-70" />
                    )}
                  </span>

                  {a.splitInto && a.splitInto >= 2 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <Scissors className="h-2.5 w-2.5" />
                      {a.splitInto} sessions
                      {!a.splitManual && " (auto)"}
                    </span>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto h-7 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Scissors className="h-3 w-3 mr-1" /> Split
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {[2, 3, 4, 5].map((n) => (
                        <DropdownMenuItem
                          key={n}
                          onClick={() => {
                            assignmentsStore.setManualSplit(a.id, n);
                            toast.success(`Split into ${n} sessions.`);
                          }}
                        >
                          {n} sessions · {Math.round(a.estimateMin / n / 15) * 15}m each
                        </DropdownMenuItem>
                      ))}
                      {a.splitInto && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => assignmentsStore.clearSplit(a.id)}>
                            Clear split
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className={isOverdue ? "font-semibold text-destructive" : "text-muted-foreground"}>
                    {a.status === "graded" ? (
                      <span>Grade: <span className="font-bold text-success">{a.grade}</span></span>
                    ) : isOverdue ? (
                      `Overdue · ${a.dueDate}`
                    ) : d === 0 ? (
                      <span className="font-semibold text-warning-foreground">Due today</span>
                    ) : d < 0 ? (
                      `Late by ${-d}d`
                    ) : (
                      `Due in ${d}d · ${a.dueDate}`
                    )}
                  </div>
                  <button className="flex items-center gap-1 text-muted-foreground/60 transition-colors hover:text-muted-foreground">
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

function EstimateEditor({ value, onCommit }: { value: number; onCommit: (mins: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setDraft(String(value)); setEditing(true); }}
        className="font-semibold tabular-nums hover:underline"
      >
        {value}
      </button>
    );
  }
  return (
    <input
      autoFocus
      type="number"
      min={15}
      max={600}
      step={15}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const n = Number(draft);
        if (!Number.isNaN(n)) onCommit(n);
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setEditing(false);
      }}
      className="w-12 bg-transparent border-b border-primary text-foreground font-semibold tabular-nums outline-none"
    />
  );
}

function NewAssignmentDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState(subjects[0].id);
  const [dueDate, setDueDate] = useState("2026-06-26");
  const [estimateOverride, setEstimateOverride] = useState<number | null>(null);

  const livePreview = useMemo(
    () => estimateMinutes(title, description, subject),
    [title, description, subject],
  );
  const estimate = estimateOverride ?? livePreview;

  function reset() {
    setTitle(""); setDescription(""); setSubject(subjects[0].id);
    setDueDate("2026-06-26"); setEstimateOverride(null);
  }

  function submit() {
    if (!title.trim()) { toast.error("Give it a title first."); return; }
    assignmentsStore.addAssignment({ title: title.trim(), description: description.trim(), subject, dueDate, estimateMin: estimate });
    toast.success(`"${title}" added · ${estimate} min auto-estimated.`);
    reset(); setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 rounded-full shadow-sm">
          <Plus className="mr-1.5 h-4 w-4" /> New assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New assignment</DialogTitle>
          <DialogDescription>
            We'll auto-estimate completion time — edit it if you disagree.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="na-title">Title</Label>
            <Input id="na-title" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Essay: Industrial Revolution" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="na-desc">Description</Label>
            <Textarea id="na-desc" value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} placeholder="Include word count, pages, or chapters for a better estimate." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="na-sub">Subject</Label>
              <select id="na-sub" value={subject} onChange={(e) => setSubject(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="na-due">Due date</Label>
              <Input id="na-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold">Estimated time</div>
              <div className="text-[11px] text-muted-foreground">
                Heuristic from title + description{estimateOverride !== null && " · overridden"}
              </div>
            </div>
            <Input type="number" min={15} max={600} step={15} value={estimate}
              onChange={(e) => setEstimateOverride(Number(e.target.value))}
              className="h-8 w-20 text-sm" />
            <span className="text-xs text-muted-foreground">min</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
