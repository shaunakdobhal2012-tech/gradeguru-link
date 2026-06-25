import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { notices, messages } from "@/lib/mock-data";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [{ title: "Messages — Scholaria" }, { name: "description", content: "School announcements and direct messages from teachers and study groups." }],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">Announcements from school, plus direct conversations.</p>
      </div>

      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="direct">Direct messages</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="mt-4 space-y-3">
          {notices.map((n) => (
            <Card key={n.id}>
              <CardContent className="space-y-2 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {n.priority === "urgent" && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Urgent</Badge>}
                  {n.priority === "important" && <Badge className="h-5 bg-warning px-1.5 text-[10px] text-warning-foreground hover:bg-warning/90">Important</Badge>}
                  {n.priority === "general" && <Badge variant="outline" className="h-5 px-1.5 text-[10px]">General</Badge>}
                  <span className="text-xs text-muted-foreground">{n.sender} · {n.timestamp}</span>
                </div>
                <h3 className="font-semibold">{n.title}</h3>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline">Acknowledge</Button>
                  <Button size="sm" variant="ghost">Reply</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="direct" className="mt-4">
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {messages.map((m) => (
                <div key={m.id} className="flex gap-3 p-4 transition-colors hover:bg-muted/40">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-accent text-accent-foreground">{m.from.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-sm ${m.unread ? "font-semibold" : "font-medium"}`}>{m.from}</p>
                      {m.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      <span className="ml-auto text-[11px] text-muted-foreground">{m.time}</span>
                    </div>
                    <p className="truncate text-sm">{m.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.preview}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 p-3">
                <input
                  placeholder="Write a message…"
                  className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Write a message"
                />
                <Button size="icon"><Send className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
