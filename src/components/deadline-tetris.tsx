import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Sparkles, Save, Wand2, RotateCcw, Lock } from "lucide-react";
import { assignments, schedule, subjectById } from "@/lib/mock-data";
import { estimateMinutes, fmtMinutes, useSplits } from "@/lib/assignment-estimate";

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
const DEFAULT_PART_SLOT = (16 - START_HOUR) * SLOTS_PER_HOUR; // 4 PM

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

const pendingAssignments = assignments.filter(
  (a) => a.status === "pending" || a.status === "in-progress" || a.status === "overdue",
);

type Item = {
  id: string;
  assignmentId: string;
  label: string;
  subject: string;
  durationMin: number;
  isPart: boolean;
  partIndex?: number;
  partTotal?: number;
  dueDate: string;
};

type Placement = { itemId: string; dayIdx: number; slot: number };

function snap30(n: number) {
  return Math.max(30, Math.round(n / 30) * 30);
}

function findDueIdx(dueDate: string): number {
  const idx = WEEK.findIndex((d) => d.date === dueDate);
  if (idx >= 0) return idx;
  if (new Date(dueDate).getTime() < new Date(WEEK[0].date).getTime()) return 0;
  return WEEK.length - 1;
}

export function DeadlineTetris({ compact = false }: { compact?: boolean }) {
  const splits = useSplits();

  const items: Item[] = useMemo(() => {
    const out: Item[] = [];
    for (const a of pendingAssignments) {
      const est = estimateMinutes(a).minutes;
      const parts = splits[a.id];
      if (parts && parts >= 2) {
        const per = snap30(est / parts);
        for (let i = 0; i < parts; i++) {
          out.push({
            id: `${a.id}::${i}`,
            assignmentId: a.id,
            label: `${a.title} · Part ${i + 1}/${parts}`,
            subject: a.subject,
            durationMin: per,
            isPart: true,
            partIndex: i + 1,
            partTotal: parts,
            dueDate: a.dueDate,
          });
        }
      } else {
        out.push({
          id: a.id,
          assignmentId: a.id,
          label: a.title,
          subject: a.subject,
          durationMin: snap30(est),
          isPart: false,
          dueDate: a.dueDate,
        });
      }
    }
    return out;
  }, [splits]);

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const [placements, setPlacements] = useState<Placement[]>([]);
  const [heatmap, setHeatmap] = useState(false);
  const [flashCell, setFlashCell] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Drop placements that point to removed item ids when splits change
  useEffect(() => {
    setPlacements((prev) => prev.filter((p) => itemById.has(p.itemId)));
  }, [itemById]);

  // Auto-place freshly created split parts on consecutive days before due date
  const seededSplits = useRef<Set<string>>(new Set());
  useEffect(() => {
    setPlacements((prev) => {
      const next = [...prev];
      const placedIds = new Set(next.map((p) => p.itemId));
      for (const [aid, parts] of Object.entries(splits)) {
        const key = `${aid}:${parts}`;
        if (seededSplits.current.has(key)) continue;
        const partItems = items.filter((i) => i.assignmentId === aid && i.isPart);
        if (partItems.length !== parts) continue;
        const a = pendingAssignments.find((x) => x.id === aid);
        if (!a) continue;
        const dueIdx = findDueIdx(a.dueDate);
        const startDay = Math.max(0, dueIdx - parts + 1);
        partItems.forEach((it, k) => {
          if (placedIds.has(it.id)) return;
          const dayIdx = Math.min(WEEK.length - 1, startDay + k);
          next.push({ itemId: it.id, dayIdx, slot: DEFAULT_PART_SLOT });
        });
        seededSplits.current.add(key);
      }
      // forget keys for removed splits
      for (const key of [...seededSplits.current]) {
        const [aid] = key.split(":");
        if (!splits[aid]) seededSplits.current.delete(key);
      }
      return next;
    });
  }, [splits, items]);

  const placedIds = new Set(placements.map((p) => p.itemId));
  const unplaced = items.filter((i) => !placedIds.has(i.id));

  function itemLen(id: string) {
    const it = itemById.get(id);
    return Math.max(1, Math.round((it?.durationMin ?? 60) / SLOT_MIN));
  }

  function occupiedSlots(dayIdx: number, exceptId?: string) {
    const occ = new Set<number>();
    classesFor(dayIdx).forEach((c) => {
      for (let i = 0; i < c.length; i++) occ.add(c.slot + i);
    });
    placements
      .filter((p) => p.dayIdx === dayIdx && p.itemId !== exceptId)
      .forEach((p) => {
        const len = itemLen(p.itemId);
        for (let i = 0; i < len; i++) occ.add(p.slot + i);
      });
    return occ;
  }

  function dayHours(dayIdx: number) {
    let mins = 0;
    classesFor(dayIdx).forEach((c) => (mins += c.length * SLOT_MIN));
    placements
      .filter((p) => p.dayIdx === dayIdx)
      .forEach((p) => (mins += itemById.get(p.itemId)?.durationMin ?? 60));
    return mins / 60;
  }

  function heatColor(hours: number) {
    const t = Math.min(1, hours / 10);
    const r = Math.round(34 + (239 - 34) * t);
    const g = Math.round(197 - (197 - 68) * t);
    const b = Math.round(94 - (94 - 68) * t);
    return `rgba(${r}, ${g}, ${b}, 0.18)`;
  }

  function tryPlace(itemId: string, dayIdx: number, slot: number) {
    const len = itemLen(itemId);
    if (slot < 0 || slot + len > TOTAL_SLOTS) return false;
    const occ = occupiedSlots(dayIdx, itemId);
    for (let i = 0; i < len; i++) if (occ.has(slot + i)) return false;
    setPlacements((prev) => {
      const next = prev.filter((p) => p.itemId !== itemId);
      next.push({ itemId, dayIdx, slot });
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
      const totalH = dayHours(dayIdx) + (itemById.get(draggingId)?.durationMin ?? 60) / 60;
      toast.error(`That's ${totalH.toFixed(1)} hours of work — move something?`);
      setTimeout(() => setFlashCell(null), 700);
    }
    setDraggingId(null);
  }

  function autoArrange() {
    const DAILY_CAP_MIN = 10 * 60; // 10 hour assignment cap per day
    const sorted = [...items].sort((a, b) => b.durationMin - a.durationMin);
    const next: Placement[] = [];
    const occByDay: Record<number, Set<number>> = {};
    const assignedMinByDay: Record<number, number> = {};
    for (let d = 0; d < WEEK.length; d++) {
      occByDay[d] = new Set<number>();
      assignedMinByDay[d] = 0;
      classesFor(d).forEach((c) => {
        for (let i = 0; i < c.length; i++) occByDay[d].add(c.slot + i);
      });
    }
    let skipped = 0;
    for (const it of sorted) {
      const len = Math.max(1, Math.round(it.durationMin / SLOT_MIN));
      let placed = false;
      for (let d = 0; d < WEEK.length && !placed; d++) {
        if (assignedMinByDay[d] + it.durationMin > DAILY_CAP_MIN) continue;
        for (let s = 0; s + len <= TOTAL_SLOTS; s++) {
          let ok = true;
          for (let i = 0; i < len; i++)
            if (occByDay[d].has(s + i)) {
              ok = false;
              break;
            }
          if (ok) {
            for (let i = 0; i < len; i++) occByDay[d].add(s + i);
            assignedMinByDay[d] += it.durationMin;
            next.push({ itemId: it.id, dayIdx: d, slot: s });
            placed = true;
            break;
          }
        }
      }
      if (!placed) skipped++;
    }
    setPlacements(next);
    if (skipped > 0) {
      toast.success(
        `Auto-arranged ${next.length} blocks · ${skipped} left out to keep days under 10h.`,
      );
    } else {
      toast.success(`Auto-arranged ${next.length} blocks around your classes.`);
    }
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
    const it = itemById.get(first.itemId);
    if (!it) return;
    toast.success("Week saved · gentle reminders scheduled", {
      description: `You planned to start your ${it.label} at ${fmtTime(first.slot)} on ${WEEK[first.dayIdx].key}.`,
      duration: 6000,
    });
  }

  const totals = useMemo(
    () => WEEK.map((_, d) => dayHours(d)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [placements, items],
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
                Drag assignments into your week. Classes are blocked in grey. Times are AI-estimated.
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
                  All blocks scheduled. Nice work.
                </p>
              )}
              <div className={`space-y-2 ${compact ? "max-h-40 overflow-y-auto" : ""}`}>
                {unplaced.map((it) => {
                  const sub = subjectById(it.subject);
                  return (
                    <div
                      key={it.id}
                      draggable
                      onDragStart={() => setDraggingId(it.id)}
                      onDragEnd={() => setDraggingId(null)}
                      className="cursor-grab active:cursor-grabbing rounded-md border-l-4 bg-card border px-2 py-1.5 text-xs shadow-sm hover:shadow transition"
                      style={{
                        borderLeftColor: sub.color,
                        borderStyle: it.isPart ? "dotted" : undefined,
                        borderColor: it.isPart ? sub.color : undefined,
                        borderLeftStyle: "solid",
                      }}
                    >
                      <div className="font-medium truncate">
                        {it.isPart ? `Part ${it.partIndex}/${it.partTotal}` : it.label}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground truncate">{sub.name}</span>
                        <Badge
                          variant="secondary"
                          className="ml-auto gap-1 px-1.5 py-0 text-[10px] font-normal"
                          title="AI estimate — auto-calculated"
                        >
                          <Sparkles className="h-2.5 w-2.5" />
                          {fmtMinutes(it.durationMin)}
                          <Lock className="h-2.5 w-2.5 opacity-60" />
                        </Badge>
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
                            className={`border-t ${s % 2 === 0 ? "border-border" : "border-border/40"} ${
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

                      {placements
                        .filter((p) => p.dayIdx === dayIdx)
                        .map((p) => {
                          const it = itemById.get(p.itemId);
                          if (!it) return null;
                          const sub = subjectById(it.subject);
                          const len = itemLen(it.id);
                          return (
                            <Tooltip key={it.id}>
                              <TooltipTrigger asChild>
                                <div
                                  draggable
                                  onDragStart={() => setDraggingId(it.id)}
                                  onDragEnd={() => setDraggingId(null)}
                                  onDoubleClick={() =>
                                    setPlacements((prev) =>
                                      prev.filter((x) => x.itemId !== it.id),
                                    )
                                  }
                                  className="absolute left-1 right-1 rounded-md text-white text-[10px] px-1.5 py-1 cursor-grab active:cursor-grabbing shadow-sm overflow-hidden"
                                  style={{
                                    top: p.slot * SLOT_PX,
                                    height: len * SLOT_PX - 2,
                                    backgroundColor: sub.color,
                                    border: it.isPart ? `1.5px dotted rgba(255,255,255,0.85)` : undefined,
                                    opacity: it.isPart ? 0.92 : 1,
                                  }}
                                >
                                  <div className="font-semibold truncate">
                                    {it.isPart
                                      ? `${sub.name} · Part ${it.partIndex}/${it.partTotal}`
                                      : it.label}
                                  </div>
                                  <div className="opacity-90 truncate">
                                    {fmtTime(p.slot)} · {fmtMinutes(it.durationMin)}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {it.isPart
                                    ? `${it.label} · double-click to unschedule`
                                    : "Double-click to unschedule"}
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
      </div>
    </TooltipProvider>
  );
}
