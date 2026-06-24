import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DeadlineTetris } from "@/components/deadline-tetris";
import { events } from "@/lib/mock-data";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [{ title: "Calendar — Scholaria" }, { name: "description", content: "All deadlines, exams, school events and personal reminders in one view." }],
  }),
  component: CalendarPage,
});

const typeColor: Record<string, string> = {
  assignment: "var(--primary)",
  exam: "var(--destructive)",
  event: "var(--success)",
  personal: "#a855f7",
};

function CalendarPage() {
  // Static June 2026 grid starting Mon June 1 (Mon=0 col? Actually June 1 2026 is Mon)
  const daysInMonth = 30;
  const monthStartOffset = 0; // Mon = 0
  const cells = Array.from({ length: monthStartOffset + daysInMonth }, (_, i) => {
    if (i < monthStartOffset) return null;
    return i - monthStartOffset + 1;
  });

  const [showTetris, setShowTetris] = useState(false);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">June 2026</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5">
          <Switch id="tetris-toggle" checked={showTetris} onCheckedChange={setShowTetris} />
          <Label htmlFor="tetris-toggle" className="text-xs cursor-pointer">Deadline Tetris view</Label>
        </div>
      </div>

      {showTetris && <DeadlineTetris compact />}

      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(typeColor).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 capitalize text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: v }} /> {k}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="py-1.5">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((day, i) => {
              const dateStr = day ? `2026-06-${String(day).padStart(2, "0")}` : "";
              const dayEvents = events.filter((e) => e.date === dateStr);
              const isToday = day === 19;
              return (
                <div
                  key={i}
                  className={`min-h-20 rounded-lg border p-1.5 text-left sm:min-h-28 ${
                    day ? "border-border bg-card" : "border-transparent"
                  } ${isToday ? "ring-2 ring-primary" : ""}`}
                >
                  {day && (
                    <>
                      <div className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>{day}</div>
                      <div className="mt-1 space-y-1">
                        {dayEvents.map((e, ix) => (
                          <div
                            key={ix}
                            className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                            style={{ backgroundColor: typeColor[e.type] }}
                          >
                            {e.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Upcoming events</CardTitle></CardHeader>
        <CardContent className="divide-y divide-border">
          {events.map((e) => (
            <div key={e.date + e.title} className="flex items-center gap-3 py-3">
              <div className="grid w-14 shrink-0 place-items-center rounded-lg bg-muted py-1.5">
                <div className="text-[10px] font-medium uppercase text-muted-foreground">Jun</div>
                <div className="text-lg font-bold leading-none">{Number(e.date.slice(-2))}</div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.title}</p>
                <Badge variant="outline" className="mt-1 h-5 px-1.5 text-[10px] capitalize">{e.type}</Badge>
              </div>
              <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: typeColor[e.type] }} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
