import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Paperclip, Upload, Filter, Sparkles, Split, Lock, Plus, Trash2, CheckCircle2, Play, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { estimateMinutes, fmtMinutes, setSplit, useSplits } from "@/lib/assignment-estimate";
import { AssignmentDialog } from "@/components/assignment-dialog";
import {
  useAssignments, useUpdateAssignment, useDeleteAssignment, useUploadSubmission,
  derivedStatus, type AssignmentRow, type AssignmentDerivedStatus,
} from "@/lib/assignments";
import { subjectColor } from "@/lib/subjects";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/assignments")({
  head: () => ({
    meta: [{ title: "Assignments — Scholaria" }, { name: "description", content: "Track every assignment across every subject, in one tracker." }],
  }),
  component: AssignmentsPage,
});

const statuses: { id: AssignmentDerivedStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "in_progress", label: "In progress" },
  { id: "submitted", label: "Submitted" },
  { id: "graded", label: "Graded" },
  { id: "overdue", label: "Overdue" },
];

const statusStyles: Record<AssignmentDerivedStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-accent text-accent-foreground",
  submitted: "bg-primary/15 text-primary",
  graded: "bg-success/15 text-success",
  overdue: "bg-destructive/15 text-destructive",
};

function AssignmentsPage() {
  const { profile } = useAuth();
  const { data: assignments = [], isLoading } = useAssignments();
  const [status, setStatus] = useState<AssignmentDerivedStatus | "all">("all");
  const [subject, setSubject] = useState<string>("all");
  const [q, setQ] = useState("");
  const splits = useSplits();
  const [gradeFor, setGradeFor] = useState<AssignmentRow | null>(null);
  const del = useDeleteAssignment();
  const update = useUpdateAssignment();
  const upload = useUploadSubmission();

  const availableSubjects = Array.from(new Set(assignments.map((a) => a.subject)));

  const filtered = assignments.filter((a) => {
    const ds = derivedStatus(a);
    return (status === "all" || ds === status)
      && (subject === "all" || a.subject === subject)
      && a.title.toLowerCase().includes(q.toLowerCase());
  });

  function handleSubmissionUpload(a: AssignmentRow, file: File) {
    upload.mutate({ assignment_id: a.id, file }, {
      onSuccess: () => toast.success(`Submitted "${a.title}"`),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Upload failed"),
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Assignments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${filtered.length} of ${assignments.length} shown`}
          </p>
        </div>
        <AssignmentDialog trigger={<Button><Plus className="mr-1.5 h-4 w-4" /> New assignment</Button>} />
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {statuses.map((s) => (
              <Button key={s.id} size="sm"
                variant={status === s.id ? "default" : "outline"}
                onClick={() => setStatus(s.id)} className="h-8">
                {s.label}
              </Button>
            ))}
          </div>
          {(availableSubjects.length > 0 || profile?.subjects?.length) && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={subject === "all" ? "secondary" : "ghost"} onClick={() => setSubject("all")} className="h-8">All subjects</Button>
              {Array.from(new Set([...(profile?.subjects ?? []), ...availableSubjects])).map((s) => (
                <Button key={s} size="sm" variant={subject === s ? "secondary" : "ghost"} onClick={() => setSubject(s)} className="h-8 gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: subjectColor(s) }} />
                  {s}
                </Button>
              ))}
            </div>
          )}
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title…" className="h-9 max-w-sm" />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-muted">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              {assignments.length === 0 ? "No assignments yet" : "Nothing matches those filters"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {assignments.length === 0
                ? "Add your first assignment to start planning."
                : "Try clearing filters or search."}
            </p>
            {assignments.length === 0 && (
              <div className="mt-6">
                <AssignmentDialog trigger={<Button><Plus className="mr-1.5 h-4 w-4" /> New assignment</Button>} />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => {
            const color = subjectColor(a.subject);
            const ds = derivedStatus(a);
            const dueMs = new Date(a.due_date).getTime() - Date.now();
            const dueDays = Math.ceil(dueMs / 86400000);
            const est = estimateMinutes(a);
            const parts = splits[a.id];
            const dueLabel = new Date(a.due_date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
            return (
              <Card key={a.id} className="group transition-shadow hover:shadow-md">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                      {a.subject}
                    </Badge>
                    <Badge className={`${statusStyles[ds]} capitalize hover:${statusStyles[ds]}`}>{ds.replace("_", " ")}</Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold leading-tight">{a.title}</h3>
                    {a.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="gap-1 cursor-not-allowed font-normal" title={`AI estimate · ${est.type}`}>
                      <Sparkles className="h-3 w-3" />
                      <span className="font-medium">{fmtMinutes(a.estimated_time)}</span>
                      <Lock className="h-2.5 w-2.5 opacity-60" />
                    </Badge>
                    {parts ? (
                      <Badge variant="outline" className="gap-1 cursor-pointer"
                        style={{ borderStyle: "dotted", borderColor: color, color }}
                        onClick={() => { setSplit(a.id, null); toast(`Merged "${a.title}" back.`); }}>
                        <Split className="h-3 w-3" /> {parts}× {fmtMinutes(Math.round(a.estimated_time / parts))}
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
                              <Button key={n} size="sm" variant="outline" className="h-7 w-9 px-0 text-xs"
                                onClick={() => { setSplit(a.id, n); toast.success(`Split into ${n} parts.`); }}>
                                {n}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  {a.grade && (
                    <div className="rounded-md border border-success/30 bg-success/5 p-2 text-xs">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3.5 w-3.5 text-success" />
                        <span className="font-semibold text-success">Grade: {a.grade}</span>
                      </div>
                      {a.feedback && <p className="mt-1 text-muted-foreground">{a.feedback}</p>}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                    <div className={ds === "overdue" ? "font-medium text-destructive" : "text-muted-foreground"}>
                      {ds === "graded" ? `Graded`
                        : ds === "submitted" ? `Submitted`
                        : ds === "overdue" ? `Overdue · ${dueLabel}`
                        : dueDays === 0 ? "Due today"
                        : dueDays < 0 ? `Late by ${-dueDays}d`
                        : `Due in ${dueDays}d · ${dueLabel}`}
                    </div>
                    {a.attachments.length > 0 && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Paperclip className="h-3.5 w-3.5" /> {a.attachments.length}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
                    {a.status === "pending" && (
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"
                        onClick={() => update.mutate({ id: a.id, patch: { status: "in_progress" } })}>
                        <Play className="h-3 w-3" /> Start
                      </Button>
                    )}
                    {(a.status === "pending" || a.status === "in_progress") && (
                      <>
                        <label className="inline-flex">
                          <input type="file" className="hidden" onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleSubmissionUpload(a, f);
                            e.target.value = "";
                          }} />
                          <span className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground">
                            {upload.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Submit
                          </span>
                        </label>
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"
                          onClick={() => update.mutate({ id: a.id, patch: { status: "submitted" } })}>
                          <CheckCircle2 className="h-3 w-3" /> Mark done
                        </Button>
                      </>
                    )}
                    {a.status === "submitted" && (
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"
                        onClick={() => setGradeFor(a)}>
                        <GraduationCap className="h-3 w-3" /> Add grade
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="ml-auto h-7 gap-1 text-xs text-destructive hover:text-destructive"
                      onClick={() => { if (confirm("Delete this assignment?")) del.mutate(a.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <GradeDialog assignment={gradeFor} onClose={() => setGradeFor(null)} />
    </div>
  );
}

function GradeDialog({ assignment, onClose }: { assignment: AssignmentRow | null; onClose: () => void }) {
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const update = useUpdateAssignment();

  return (
    <Dialog open={!!assignment} onOpenChange={(v) => { if (!v) { onClose(); setGrade(""); setFeedback(""); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record grade</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Grade (e.g. A-, 87%, 4.5)" value={grade} onChange={(e) => setGrade(e.target.value)} />
          <Textarea placeholder="Teacher feedback (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!grade.trim() || !assignment || update.isPending}
            onClick={() => {
              if (!assignment) return;
              update.mutate(
                { id: assignment.id, patch: { grade: grade.trim(), feedback: feedback.trim() || null, status: "graded" } },
                {
                  onSuccess: () => { toast.success("Grade saved"); setGrade(""); setFeedback(""); onClose(); },
                  onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
                },
              );
            }}>
            Save grade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
