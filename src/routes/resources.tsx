import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Video, FileSpreadsheet, Download, Eye, Search, Upload } from "lucide-react";
import { resources, subjects, subjectById } from "@/lib/mock-data";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resource library — Scholaria" },
      { name: "description", content: "Notes, worksheets, past papers and videos organized by subject and topic." },
    ],
  }),
  component: ResourcesPage,
});

const typeIcon: Record<string, typeof FileText> = {
  Notes: FileText,
  Worksheet: FileSpreadsheet,
  "Past Paper": FileSpreadsheet,
  Video: Video,
};

function ResourcesPage() {
  const [subject, setSubject] = useState("all");
  const [q, setQ] = useState("");
  const filtered = resources.filter(
    (r) =>
      (subject === "all" || r.subject === subject) &&
      (r.title.toLowerCase().includes(q.toLowerCase()) || r.topic.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Resource library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="h-9 rounded-full shadow-sm">
          <Upload className="mr-1.5 h-4 w-4" /> Upload resource
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/60 shadow-[0_1px_3px_0_oklch(0.2_0.04_255/5%)]">
        <CardContent className="space-y-3 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title or topic…"
              className="h-9 rounded-full border-border/60 bg-muted/40 pl-8 text-sm placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSubject("all")}
              className={`h-8 rounded-full px-3.5 text-xs font-medium transition-all duration-150 ${
                subject === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              All subjects
            </button>
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSubject(s.id)}
                className={`flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-all duration-150 ${
                  subject === s.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => {
          const sub = subjectById(r.subject);
          const Icon = typeIcon[r.type] ?? FileText;
          return (
            <Card
              key={r.id}
              className="group overflow-hidden border-border/60 shadow-[0_1px_3px_0_oklch(0.2_0.04_255/5%)] transition-all duration-200 hover:shadow-[0_4px_12px_0_oklch(0.2_0.04_255/8%)] hover:-translate-y-0.5"
            >
              {/* Subject top bar */}
              <div className="h-0.5 w-full" style={{ backgroundColor: sub.color }} />
              <CardContent className="space-y-3.5 p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                    style={{ backgroundColor: `${sub.color}18`, color: sub.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-tight">{r.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{sub.name} · {r.topic}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px]">{r.type}</Badge>
                  {r.syllabus && (
                    <Badge className="h-5 rounded-full bg-success/12 px-2 text-[10px] text-success hover:bg-success/12">
                      Syllabus
                    </Badge>
                  )}
                  <span className="ml-auto text-[11px] text-muted-foreground">{r.date}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 flex-1 rounded-full text-xs">
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:text-foreground">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
