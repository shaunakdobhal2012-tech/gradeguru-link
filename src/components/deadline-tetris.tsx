import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Sparkles, Save, Wand as Wand2, RotateCcw, TriangleAlert as AlertTriangle, Scissors } from "lucide-react";
import { schedule, subjectById } from "@/lib/mock-data";
import {
  assignmentsStore,
  chunksFor,
  useAssignmentsStore,
  type Assignment,
  type Chunk,
  type ChunkPlacement,
} from "@/lib/assignments-store";

// Week of June 22–28, 2026 (Mon–Sun)
const WEEK = [
  { key: "Mon", date: "2026-06-22" },
  { key: "Tue", date: "2026-06-23" },
  { key: "Wed", date: "2026-06-24" },
  { key: "Thu", date: "2026-06-25" },
  { key: "Fri", date: "2026-06-26" },
  { key: "Sat", date: "2026-06-27" },
  { key: "Sun", date: "2026-06-28" },
];

const START_HOUR = 6;
const END_HOUR = 22;
const SLOT_MIN = 30;
const SLOTS_PER_HOUR = 60 / SLOT_MIN;
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR;
const SLOT_PX = 22;
const DAILY_HOMEWORK_CAP_MIN = 240; // 4 hours of assignment time / day

function fmtTime(slotIdx: number) {
  const total = START_HOUR * 60 + slotIdx * SLOT_MIN;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

function parseHHMM(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function classesFor(dayIdx: number) {
  if (dayIdx > 4) return [];
  return schedule.map((s) => {
    const startMin = parseHHMM(s.time) - START_HOUR * 60;
    const slot = Math.round(startMin / SLOT_MIN);
    return {
      id: `class-${dayIdx}-${s.time}`,
      slot,
      length: 2,
      label: s.subject,
      room: s.room,
    };
  });
}

function dueDayIdx(dueDate: string): number {
  // Index in WEEK that this due date falls on (or -1 / 6+ if outside).
  const idx = WEEK.findIndex((d) => d.date === dueDate);
  if (idx >= 0) return idx;
  const due = new Date(dueDate).getTime();
  const monday = new Date(WEEK[0].date).getTime();
  if (due < monday) return -1; // overdue relative to this week
  return WEEK.length - 1; // beyond this week — clamp to end
}

export function DeadlineTetris({ compact = false }: { compact?: boolean }) {
  const { assignments, placements, flagged } = useAssignmentsStore();
  const [heatmap, setHeatmap] = useState(false);
  const [flashCell, setFlashCell] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const pending = useMemo(
    () =>
      assignments.filter(
        (a) =>
          a.status === "pending" ||
          a.status === "in-progress" ||
          a.status === "overdue",
      ),
    [assignments],
  );
  const assignmentById = useMemo(() => {
    const m = new Map<string, Assignment>();
    assignments.forEach((a) => m.set(a.id, a));
    return m;
  }, [assignments]);

  const allChunks = useMemo(() => {
    const out: Chunk[] = [];
    pending.forEach((a) => out.push(...chunksFor(a)));
    return out;
  }, [pending]);

  const chunkById = useMemo(() => {
    const m = new Map<string, Chunk>();
    allChunks.forEach((c) => m.set(c.chunkId, c));
    return m;
  }, [allChunks]);

  const placedIds = new Set(placements.map((p) => p.chunkId));
  const unplaced = allChunks.filter((c) => !placedIds.has(c.chunkId));

  function chunkLen(durationMin: number) {
    return Math.max(1, Math.round(durationMin / SLOT_MIN));
  }

  function occupiedSlots(dayIdx: number, exceptChunkId?: string) {
    const occ = new Set<number>();
    classesFor(dayIdx).forEach((c) => {
      for (let i = 0; i < c.length; i++) occ.add(c.slot + i);
    });
    placements
      .filter((p) => p.dayIdx === dayIdx && p.chunkId !== exceptChunkId)
      .forEach((p) => {
        const len = chunkLen(p.durationMin);
        for (let i = 0; i < len; i++) occ.add(p.slot + i);
      });
    return occ;
  }

  function dayAssignmentMin(dayIdx: number) {
    return placements
      .filter((p) => p.dayIdx === dayIdx)
      .reduce((sum, p) => sum + p.durationMin, 0);
  }

  function dayTotalHours(dayIdx: number) {
    const classMin = classesFor(dayIdx).reduce(
      (s, c) => s + c.length * SLOT_MIN,
      0,
    );
    return (classMin + dayAssignmentMin(dayIdx)) / 60;
  }

  function heatColor(hours: number) {
    const t = Math.min(1, hours / 10);
    const r = Math.round(34 + (239 - 34) * t);
    const g = Math.round(197 - (197 - 68) * t);
    const b = Math.round(94 - (94 - 68) * t);
    return `rgba(${r}, ${g}, ${b}, 0.18)`;
  }

  function tryPlace(chunkId: string, dayIdx: number, slot: number) {
    const c = chunkById.get(chunkId);
    if (!c) return false;
    const len = chunkLen(c.durationMin);
    if (slot < 0 || slot + len > TOTAL_SLOTS) return false;
    const occ = occupiedSlots(dayIdx, chunkId);
    for (let i = 0; i < len; i++) if (occ.has(slot + i)) return false;
    assignmentsStore.placeChunk({
      chunkId,
      assignmentId: c.assignmentId,
      partIndex: c.partIndex,
      partsTotal: c.partsTotal,
      durationMin: c.durationMin,
      dayIdx,
      slot,
    });
    return true;
  }

  function handleDrop(dayIdx: number, slot: number) {
    if (!draggingId) return;
    const ok = tryPlace(draggingId, dayIdx, slot);
    if (!ok) {
      const key = `${dayIdx}-${slot}`;
      setFlashCell(key);
      const c = chunkById.get(draggingId);
      const total = (dayAssignmentMin(dayIdx) + (c?.durationMin ?? 0)) / 60;
      toast.error(`Won't fit — ${total.toFixed(1)}h of work on that day already.`);
      setTimeout(() => setFlashCell(null), 700);
    }
    setDraggingId(null);
  }

  // Smart auto-arrange with auto-split.
  function autoArrange() {
    // 1. Sort by due date (overdue first → earlier first).
    const sorted = [...pending].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

    // 2. Decide auto-splits (skip manual splits).
    sorted.forEach((a) => {
      if (a.splitManual) return;
      if (a.estimateMin > 90) {
        const parts = Math.min(5, Math.max(2, Math.ceil(a.estimateMin / 60)));
        assignmentsStore.applyAutoSplit(a.id, parts);
      }
    });

    // Re-read fresh state after split decisions.
    const fresh = assignmentsStore.get().assignments.filter((a) =>
      pending.some((p) => p.id === a.id),
    );
    const freshSorted = [...fresh].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

    // Per-day assignment-minutes ledger (classes do NOT count toward the 4h cap).
    const assignmentMinByDay: number[] = WEEK.map(() => 0);
    // Occupied slots ledger includes classes so we don't overlap them.
    const occByDay: Set<number>[] = WEEK.map((_, d) => {
      const set = new Set<number>();
      classesFor(d).forEach((c) => {
        for (let i = 0; i < c.length; i++) set.add(c.slot + i);
      });
      return set;
    });

    const next: ChunkPlacement[] = [];
    const flags: Record<string, string> = {};

    // Returns candidate day indices in preference order for a given deadline day:
    // weekdays first (Mon–Fri), then weekend, both ordered by proximity to deadline.
    function candidateDays(lastDay: number): number[] {
      const weekdays: number[] = [];
      const weekend: number[] = [];
      for (let d = lastDay; d >= 0; d--) {
        (d < 5 ? weekdays : weekend).push(d);
      }
      // Forward overflow (after deadline but still within the week), weekdays first.
      const fwdWeekdays: number[] = [];
      const fwdWeekend: number[] = [];
      for (let d = lastDay + 1; d < WEEK.length; d++) {
        (d < 5 ? fwdWeekdays : fwdWeekend).push(d);
      }
      return [...weekdays, ...fwdWeekdays, ...weekend, ...fwdWeekend];
    }

    function placeChunkInDay(c: Chunk, d: number): boolean {
      const len = chunkLen(c.durationMin);
      // 4h cap applies only to assignment time, not to classes.
      if (assignmentMinByDay[d] + c.durationMin > DAILY_HOMEWORK_CAP_MIN) return false;
      for (let s = 0; s + len <= TOTAL_SLOTS; s++) {
        let ok = true;
        for (let i = 0; i < len; i++) {
          if (occByDay[d].has(s + i)) { ok = false; break; }
        }
        if (ok) {
          for (let i = 0; i < len; i++) occByDay[d].add(s + i);
          assignmentMinByDay[d] += c.durationMin;
          next.push({
            chunkId: c.chunkId,
            assignmentId: c.assignmentId,
            partIndex: c.partIndex,
            partsTotal: c.partsTotal,
            durationMin: c.durationMin,
            dayIdx: d,
            slot: s,
          });
          return true;
        }
      }
      return false;
    }

    for (const a of freshSorted) {
      const chunks = chunksFor(a);
      const lastDay = Math.min(WEEK.length - 1, Math.max(0, dueDayIdx(a.dueDate)));

      // Build a per-chunk target day spreading backwards from the deadline,
      // then resolve each chunk using weekday-first candidate ordering.
      const placedChunks: boolean[] = [];
      for (let i = chunks.length - 1; i >= 0; i--) {
        const targetDay = Math.max(0, lastDay - (chunks.length - 1 - i));
        // Pick the least-loaded candidate day (weekdays prioritised).
        const candidates = candidateDays(targetDay);
        // Sort candidates by current assignment load so we spread evenly,
        // but preserve weekday-before-weekend preference within equal-load days.
        const sorted = candidates.slice().sort(
          (a, b) => assignmentMinByDay[a] - assignmentMinByDay[b],
        );
        // Re-inject weekday ordering: among days with equal load prefer weekdays.
        const byLoad = sorted.sort((a, b) => {
          const diff = assignmentMinByDay[a] - assignmentMinByDay[b];
          if (diff !== 0) return diff;
          // Tie-break: weekday (< 5) beats weekend.
          return (a < 5 ? 0 : 1) - (b < 5 ? 0 : 1);
        });

        let placed = false;
        for (const d of byLoad) {
          placed = placeChunkInDay(chunks[i], d);
          if (placed) break;
        }
        placedChunks[i] = placed;
      }
      if (placedChunks.some((p) => !p)) {
        flags[a.id] = "Needs more time — extend deadline or split manually?";
      }
    }

    assignmentsStore.setPlacements(next, flags);
    const flaggedCount = Object.keys(flags).length;
    if (flaggedCount > 0) {
      toast.warning(
        `Arranged ${next.length} blocks. ${flaggedCount} couldn't fit — flagged red.`,
      );
    } else {
      toast.success(`Auto-arranged ${next.length} blocks around your classes.`);
    }
  }

  function clearAll() {
    assignmentsStore.clearAllPlacements();
  }

  function saveWeek() {
    if (placements.length === 0) {
      toast("Nothing to save yet — drag some assignments first.");
      return;
    }
    const first = [...placements].sort(
      (a, b) => a.dayIdx - b.dayIdx || a.slot - b.slot,
    )[0];
    const a = assignmentById.get(first.assignmentId);
    if (!a) return;
    toast.success("Week saved · gentle reminders scheduled", {
      description: `You planned to start your ${a.title} at ${fmtTime(first.slot)} on ${WEEK[first.dayIdx].key}.`,
      duration: 6000,
    });
  }

  function updateDuration(assignmentId: string, mins: number) {
    assignmentsStore.updateEstimate(assignmentId, mins);
  }

  const totals = useMemo(
    () => WEEK.map((_, d) => dayTotalHours(d)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [placements],
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Deadline Tetris
            </h2>
            {!compact && (
              <p className="mt-1 text-sm text-muted-foreground">
                Drag assignments into your week. Classes are blocked in grey.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5">
              <Switch id="heat" checked={heatmap} onCheckedChange={setHeatmap} />
              <Label htmlFor="heat" className="text-xs cursor-pointer">
                Workload heatmap
              </Label>
            </div>
            <Button size="sm" variant="outline" onClick={autoArrange}>
              <Wand2 className="h-4 w-4 mr-1" /> Smart auto-arrange
            </Button>
            <Button size="sm" variant="ghost" onClick={clearAll}>
              <RotateCcw className="h-4 w-4 mr-1" /> Clear
            </Button>
            <Button size="sm" onClick={saveWeek}>
              <Save className="h-4 w-4 mr-1" /> Save my week
            </Button>
          </div>
        </div>

        <div className={`grid gap-4 ${compact ? "" : "lg:grid-cols-[280px_1fr]"}`}>
          {/* Assignment tray */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Pending blocks</h3>
                <Badge variant="outline" className="text-[10px]">
                  {unplaced.length} left
                </Badge>
              </div>
              {unplaced.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  All chunks scheduled. Nice work.
                </p>
              )}
              <div className={`space-y-2 ${compact ? "max-h-48 overflow-y-auto" : ""}`}>
                {unplaced.map((c) => {
                  const a = assignmentById.get(c.assignmentId);
                  if (!a) return null;
                  const sub = subjectById(a.subject);
                  const isFlagged = !!flagged[a.id];
                  return (
                    <div
                      key={c.chunkId}
                      draggable
                      onDragStart={() => setDraggingId(c.chunkId)}
                      onDragEnd={() => setDraggingId(null)}
                      className={`cursor-grab active:cursor-grabbing rounded-md border-l-4 border px-2 py-1.5 text-xs shadow-sm hover:shadow transition ${
                        isFlagged
                          ? "bg-destructive/10 border-destructive/60"
                          : "bg-card"
                      }`}
                      style={
                        isFlagged
                          ? undefined
                          : { borderLeftColor: sub.color }
                      }
                    >
                      <div className="flex items-center gap-1 font-medium">
                        <span className="truncate">{a.title}</span>
                        {c.partsTotal > 1 && (
                          <Badge
                            variant="secondary"
                            className="ml-auto shrink-0 text-[9px] px-1 py-0"
                          >
                            Part {c.partIndex}/{c.partsTotal}
                            {a.splitManual ? "" : " · auto"}
                          </Badge>
                        )}
                      </div>
                      {isFlagged && (
                        <div className="mt-1 flex items-start gap-1 text-[10px] text-destructive">
                          <AlertTriangle className="h-3 w-3 mt-px shrink-0" />
                          <span>{flagged[a.id]}</span>
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          {sub.name}
                        </span>
                        {c.partsTotal === 1 ? (
                          <>
                            <Input
                              type="number"
                              min={15}
                              max={600}
                              step={15}
                              value={a.estimateMin}
                              onChange={(e) =>
                                updateDuration(a.id, Number(e.target.value))
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="h-6 w-16 text-[10px] px-1 ml-auto"
                            />
                            <span className="text-[10px] text-muted-foreground">
                              min
                            </span>
                          </>
                        ) : (
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            {c.durationMin} min
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Grid */}
          <Card>
            <CardContent className="p-2 sm:p-3 overflow-x-auto">
              <div className="min-w-[640px]">
                <div
                  className="grid sticky top-0 z-10 bg-card"
                  style={{
                    gridTemplateColumns: `48px repeat(${WEEK.length}, minmax(0,1fr))`,
                  }}
                >
                  <div />
                  {WEEK.map((d, i) => (
                    <div key={d.key} className="px-1 py-1 text-center">
                      <div className="text-xs font-semibold">{d.key}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {totals[i].toFixed(1)}h
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="grid relative"
                  style={{
                    gridTemplateColumns: `48px repeat(${WEEK.length}, minmax(0,1fr))`,
                  }}
                >
                  <div>
                    {Array.from({ length: TOTAL_SLOTS }, (_, s) => (
                      <div
                        key={s}
                        className="text-[10px] text-muted-foreground pr-1 text-right border-t border-transparent"
                        style={{ height: SLOT_PX }}
                      >
                        {s % 2 === 0 ? fmtTime(s) : ""}
                      </div>
                    ))}
                  </div>

                  {WEEK.map((d, dayIdx) => (
                    <div
                      key={d.key}
                      className="relative border-l"
                      style={{
                        height: SLOT_PX * TOTAL_SLOTS,
                        background: heatmap ? heatColor(totals[dayIdx]) : undefined,
                      }}
                    >
                      {Array.from({ length: TOTAL_SLOTS }, (_, s) => {
                        const key = `${dayIdx}-${s}`;
                        const flash = flashCell === key;
                        return (
                          <div
                            key={s}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(dayIdx, s)}
                            className={`border-t ${
                              s % 2 === 0 ? "border-border" : "border-border/40"
                            } ${
                              flash ? "bg-destructive/40" : "hover:bg-muted/40"
                            } transition-colors`}
                            style={{ height: SLOT_PX }}
                          />
                        );
                      })}

                      {classesFor(dayIdx).map((c) => (
                        <Tooltip key={c.id}>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute left-1 right-1 rounded-md bg-muted border border-border/60 px-1.5 py-1 text-[10px] overflow-hidden"
                              style={{
                                top: c.slot * SLOT_PX,
                                height: c.length * SLOT_PX - 2,
                              }}
                            >
                              <div className="font-medium truncate">{c.label}</div>
                              <div className="text-muted-foreground truncate">
                                {c.room}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              Class · {c.label} · {c.room}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}

                      {placements
                        .filter((p) => p.dayIdx === dayIdx)
                        .map((p) => {
                          const a = assignmentById.get(p.assignmentId);
                          if (!a) return null;
                          const sub = subjectById(a.subject);
                          const len = chunkLen(p.durationMin);
                          // Per-part opacity shading for visual linkage.
                          const shade =
                            p.partsTotal > 1
                              ? 1 - (p.partIndex - 1) * (0.25 / Math.max(1, p.partsTotal - 1))
                              : 1;
                          return (
                            <Tooltip key={p.chunkId}>
                              <TooltipTrigger asChild>
                                <div
                                  draggable
                                  onDragStart={() => setDraggingId(p.chunkId)}
                                  onDragEnd={() => setDraggingId(null)}
                                  onDoubleClick={() =>
                                    assignmentsStore.removePlacement(p.chunkId)
                                  }
                                  className="absolute left-1 right-1 rounded-md text-white text-[10px] px-1.5 py-1 cursor-grab active:cursor-grabbing shadow-sm overflow-hidden"
                                  style={{
                                    top: p.slot * SLOT_PX,
                                    height: len * SLOT_PX - 2,
                                    backgroundColor: sub.color,
                                    opacity: shade,
                                    borderLeft:
                                      p.partsTotal > 1
                                        ? `3px solid ${sub.color}`
                                        : undefined,
                                  }}
                                >
                                  <div className="font-semibold truncate">
                                    {a.title}
                                  </div>
                                  <div className="opacity-90 truncate">
                                    {fmtTime(p.slot)} · {p.durationMin}m
                                    {p.partsTotal > 1 &&
                                      ` · Part ${p.partIndex}/${p.partsTotal}`}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {p.partsTotal > 1
                                    ? `${a.title} — Part ${p.partIndex} of ${p.partsTotal}${a.splitManual ? " (manual)" : " (auto)"}`
                                    : a.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  Double-click to unschedule
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {Object.keys(flagged).length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive flex items-start gap-2">
            <Scissors className="h-4 w-4 mt-px shrink-0" />
            <div>
              <strong>Some work didn't fit this week.</strong> Open the Assignments
              page and use <em>Split</em> to break long tasks into more sessions,
              or extend the deadline.
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
