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
import { Sparkles, Save, Wand2, RotateCcw } from "lucide-react";
import { assignments, schedule, subjectById } from "@/lib/mock-data";

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

const START_HOUR = 6; // 6 AM
const END_HOUR = 22; // 10 PM
const SLOT_MIN = 30;
const SLOTS_PER_HOUR = 60 / SLOT_MIN;
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR; // 32
const SLOT_PX = 22;

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

// Classes pulled from "Today's schedule" data — recurring Mon–Fri, 1 hr each
function classesFor(dayIdx: number) {
  if (dayIdx > 4) return [];
  return schedule.map((s) => {
    const startMin = parseHHMM(s.time) - START_HOUR * 60;
    const slot = Math.round(startMin / SLOT_MIN);
    return {
      id: `class-${dayIdx}-${s.time}`,
      slot,
      length: 2, // 1 hr
      label: s.subject,
      room: s.room,
    };
  });
}

type Placement = {
  assignmentId: string;
  dayIdx: number;
  slot: number;
};

type Block = {
  assignmentId: string;
  durationMin: number; // editable
};

const pendingAssignments = assignments.filter(
  (a) => a.status === "pending" || a.status === "in-progress" || a.status === "overdue",
);

export function DeadlineTetris({ compact = false }: { compact?: boolean }) {
  const [blocks, setBlocks] = useState<Record<string, Block>>(() =>
    Object.fromEntries(
      pendingAssignments.map((a) => [a.id, { assignmentId: a.id, durationMin: 60 }]),
    ),
  );
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [heatmap, setHeatmap] = useState(false);
  const [flashCell, setFlashCell] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const placedIds = new Set(placements.map((p) => p.assignmentId));
  const unplaced = pendingAssignments.filter((a) => !placedIds.has(a.id));

  function blockLen(id: string) {
    return Math.max(1, Math.round((blocks[id]?.durationMin ?? 60) / SLOT_MIN));
  }

  function occupiedSlots(dayIdx: number, exceptId?: string) {
    const occ = new Set<number>();
    classesFor(dayIdx).forEach((c) => {
      for (let i = 0; i < c.length; i++) occ.add(c.slot + i);
    });
    placements
      .filter((p) => p.dayIdx === dayIdx && p.assignmentId !== exceptId)
      .forEach((p) => {
        const len = blockLen(p.assignmentId);
        for (let i = 0; i < len; i++) occ.add(p.slot + i);
      });
    return occ;
  }

  function dayHours(dayIdx: number) {
    let mins = 0;
    classesFor(dayIdx).forEach((c) => (mins += c.length * SLOT_MIN));
    placements
      .filter((p) => p.dayIdx === dayIdx)
      .forEach((p) => (mins += blocks[p.assignmentId]?.durationMin ?? 60));
    return mins / 60;
  }

  function heatColor(hours: number) {
    // 0 → green; 10+ → red
    const t = Math.min(1, hours / 10);
    const r = Math.round(34 + (239 - 34) * t);
    const g = Math.round(197 - (197 - 68) * t);
    const b = Math.round(94 - (94 - 68) * t);
    return `rgba(${r}, ${g}, ${b}, 0.18)`;
  }

  function tryPlace(assignmentId: string, dayIdx: number, slot: number) {
    const len = blockLen(assignmentId);
    if (slot < 0 || slot + len > TOTAL_SLOTS) return false;
    const occ = occupiedSlots(dayIdx, assignmentId);
    for (let i = 0; i < len; i++) if (occ.has(slot + i)) return false;
    setPlacements((prev) => {
      const next = prev.filter((p) => p.assignmentId !== assignmentId);
      next.push({ assignmentId, dayIdx, slot });
      return next;
    });
    return true;
  }

  function handleDrop(dayIdx: number, slot: number) {
    if (!draggingId) return;
    const ok = tryPlace(draggingId, dayIdx, slot);
    if (!ok) {
      const key = `${dayIdx}-${slot}`;
      setFlashCell(key);
      const totalH = dayHours(dayIdx) + (blocks[draggingId]?.durationMin ?? 60) / 60;
      toast.error(`That's ${totalH.toFixed(1)} hours of work — move something?`);
      setTimeout(() => setFlashCell(null), 700);
    }
    setDraggingId(null);
  }

  function autoArrange() {
    // Greedy: longest first, earliest free slot Mon→Sun, avoid classes
    const sorted = [...pendingAssignments].sort(
      (a, b) => (blocks[b.id]?.durationMin ?? 60) - (blocks[a.id]?.durationMin ?? 60),
    );
    const next: Placement[] = [];
    const occByDay: Record<number, Set<number>> = {};
    for (let d = 0; d < WEEK.length; d++) {
      occByDay[d] = new Set<number>();
      classesFor(d).forEach((c) => {
        for (let i = 0; i < c.length; i++) occByDay[d].add(c.slot + i);
      });
    }
    for (const a of sorted) {
      const len = Math.max(1, Math.round((blocks[a.id]?.durationMin ?? 60) / SLOT_MIN));
      let placed = false;
      for (let d = 0; d < WEEK.length && !placed; d++) {
        for (let s = 0; s + len <= TOTAL_SLOTS; s++) {
          let ok = true;
          for (let i = 0; i < len; i++) if (occByDay[d].has(s + i)) { ok = false; break; }
          if (ok) {
            for (let i = 0; i < len; i++) occByDay[d].add(s + i);
            next.push({ assignmentId: a.id, dayIdx: d, slot: s });
            placed = true;
            break;
          }
        }
      }
    }
    setPlacements(next);
    toast.success(`Auto-arranged ${next.length} assignments around your classes.`);
  }

  function clearAll() {
    setPlacements([]);
  }

  function saveWeek() {
    if (placements.length === 0) {
      toast("Nothing to save yet — drag some assignments first.");
      return;
    }
    const first = [...placements].sort(
      (a, b) => a.dayIdx - b.dayIdx || a.slot - b.slot,
    )[0];
    const a = pendingAssignments.find((x) => x.id === first.assignmentId)!;
    toast.success("Week saved · gentle reminders scheduled", {
      description: `You planned to start your ${a.title} at ${fmtTime(first.slot)} on ${WEEK[first.dayIdx].key}.`,
      duration: 6000,
    });
  }

  function updateDuration(id: string, mins: number) {
    setBlocks((prev) => ({
      ...prev,
      [id]: { assignmentId: id, durationMin: Math.max(30, Math.min(480, mins)) },
    }));
  }

  const totals = useMemo(
    () => WEEK.map((_, d) => dayHours(d)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [placements, blocks],
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
              <Label htmlFor="heat" className="text-xs cursor-pointer">Workload heatmap</Label>
            </div>
            <Button size="sm" variant="outline" onClick={autoArrange}>
              <Wand2 className="h-4 w-4 mr-1" /> Auto-arrange
            </Button>
            <Button size="sm" variant="ghost" onClick={clearAll}>
              <RotateCcw className="h-4 w-4 mr-1" /> Clear
            </Button>
            <Button size="sm" onClick={saveWeek}>
              <Save className="h-4 w-4 mr-1" /> Save my week
            </Button>
          </div>
        </div>

        <div className={`grid gap-4 ${compact ? "" : "lg:grid-cols-[260px_1fr]"}`}>
          {/* Assignment tray */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Pending blocks</h3>
                <Badge variant="outline" className="text-[10px]">{unplaced.length} left</Badge>
              </div>
              {unplaced.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  All assignments scheduled. Nice work.
                </p>
              )}
              <div className={`space-y-2 ${compact ? "max-h-40 overflow-y-auto" : ""}`}>
                {unplaced.map((a) => {
                  const sub = subjectById(a.subject);
                  return (
                    <div
                      key={a.id}
                      draggable
                      onDragStart={() => setDraggingId(a.id)}
                      onDragEnd={() => setDraggingId(null)}
                      className="cursor-grab active:cursor-grabbing rounded-md border-l-4 bg-card border px-2 py-1.5 text-xs shadow-sm hover:shadow transition"
                      style={{ borderLeftColor: sub.color }}
                    >
                      <div className="font-medium truncate">{a.title}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">{sub.name}</span>
                        <Input
                          type="number"
                          min={30}
                          max={480}
                          step={30}
                          value={blocks[a.id]?.durationMin ?? 60}
                          onChange={(e) => updateDuration(a.id, Number(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 w-14 text-[10px] px-1 ml-auto"
                        />
                        <span className="text-[10px] text-muted-foreground">min</span>
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
                {/* Day headers */}
                <div
                  className="grid sticky top-0 z-10 bg-card"
                  style={{ gridTemplateColumns: `48px repeat(${WEEK.length}, minmax(0,1fr))` }}
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
                  style={{ gridTemplateColumns: `48px repeat(${WEEK.length}, minmax(0,1fr))` }}
                >
                  {/* time column */}
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
                      {/* slot grid */}
                      {Array.from({ length: TOTAL_SLOTS }, (_, s) => {
                        const key = `${dayIdx}-${s}`;
                        const flash = flashCell === key;
                        return (
                          <div
                            key={s}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(dayIdx, s)}
                            className={`border-t ${s % 2 === 0 ? "border-border" : "border-border/40"} ${
                              flash ? "bg-destructive/40" : "hover:bg-muted/40"
                            } transition-colors`}
                            style={{ height: SLOT_PX }}
                          />
                        );
                      })}

                      {/* classes */}
                      {classesFor(dayIdx).map((c) => (
                        <Tooltip key={c.id}>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute left-1 right-1 rounded-md bg-muted border border-border/60 px-1.5 py-1 text-[10px] overflow-hidden"
                              style={{ top: c.slot * SLOT_PX, height: c.length * SLOT_PX - 2 }}
                            >
                              <div className="font-medium truncate">{c.label}</div>
                              <div className="text-muted-foreground truncate">{c.room}</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Class · {c.label} · {c.room}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}

                      {/* placed blocks */}
                      {placements
                        .filter((p) => p.dayIdx === dayIdx)
                        .map((p) => {
                          const a = pendingAssignments.find((x) => x.id === p.assignmentId)!;
                          const sub = subjectById(a.subject);
                          const len = blockLen(p.assignmentId);
                          return (
                            <Tooltip key={p.assignmentId}>
                              <TooltipTrigger asChild>
                                <div
                                  draggable
                                  onDragStart={() => setDraggingId(p.assignmentId)}
                                  onDragEnd={() => setDraggingId(null)}
                                  onDoubleClick={() =>
                                    setPlacements((prev) =>
                                      prev.filter((x) => x.assignmentId !== p.assignmentId),
                                    )
                                  }
                                  className="absolute left-1 right-1 rounded-md text-white text-[10px] px-1.5 py-1 cursor-grab active:cursor-grabbing shadow-sm overflow-hidden"
                                  style={{
                                    top: p.slot * SLOT_PX,
                                    height: len * SLOT_PX - 2,
                                    backgroundColor: sub.color,
                                  }}
                                >
                                  <div className="font-semibold truncate">{a.title}</div>
                                  <div className="opacity-90 truncate">
                                    {fmtTime(p.slot)} · {blocks[p.assignmentId].durationMin}m
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Double-click to unschedule</p>
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
      </div>
    </TooltipProvider>
  );
}
