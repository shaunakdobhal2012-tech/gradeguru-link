import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Video, FileSpreadsheet, Download, Eye, Search } from "lucide-react";
import { resources, subjects, subjectById } from "@/lib/mock-data";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [{ title: "Resource library — Scholaria" }, { name: "description", content: "Notes, worksheets, past papers and videos organized by subject and topic." }],
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
  const filtered = resources.filter((r) =>
    (subject === "all" || r.subject === subject) &&
    (r.title.toLowerCase().includes(q.toLowerCase()) || r.topic.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Resource library</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} items</p>
        </div>
        <Button variant="outline">Upload resource</Button>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resources by title or topic…" className="h-10 pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={subject === "all" ? "secondary" : "ghost"} onClick={() => setSubject("all")} className="h-8">All</Button>
            {subjects.map((s) => (
              <Button key={s.id} size="sm" variant={subject === s.id ? "secondary" : "ghost"} onClick={() => setSubject(s.id)} className="h-8 gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => {
          const sub = subjectById(r.subject);
          const Icon = typeIcon[r.type] ?? FileText;
          return (
            <Card key={r.id} className="group transition-shadow hover:shadow-md">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${sub.color}22`, color: sub.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-tight">{r.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{sub.name} · {r.topic}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px]">{r.type}</Badge>
                  {r.syllabus && <Badge className="h-5 bg-success/15 px-1.5 text-[10px] text-success hover:bg-success/15">Syllabus relevant</Badge>}
                  <span className="ml-auto text-[11px] text-muted-foreground">{r.date}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 flex-1"><Eye className="mr-1.5 h-3.5 w-3.5" />Preview</Button>
                  <Button size="sm" variant="ghost" className="h-8"><Download className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
