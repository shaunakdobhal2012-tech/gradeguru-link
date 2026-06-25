import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bell, BellOff } from "lucide-react";
import { notices, messages } from "@/lib/mock-data";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Scholaria" },
      { name: "description", content: "School announcements and direct messages from teachers and study groups." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const unread = notices.filter((n) => !n.read).length;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Announcements from school, plus direct conversations.
        </p>
      </div>

      <Tabs defaultValue="announcements">
        <TabsList className="h-10 rounded-full border border-border/60 bg-muted/50 p-1">
          <TabsTrigger value="announcements" className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Announcements
            {unread > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {unread}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="direct" className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Direct messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="mt-5 space-y-3">
          {notices.map((n) => {
            const borderLeft =
              n.priority === "urgent"
                ? "border-l-4 border-l-destructive"
                : n.priority === "important"
                ? "border-l-4 border-l-warning"
                : "";
            return (
              <Card
                key={n.id}
                className={`overflow-hidden border-border/60 shadow-[0_1px_3px_0_oklch(0.2_0.04_255/5%)] transition-all hover:shadow-[0_4px_10px_0_oklch(0.2_0.04_255/7%)] ${borderLeft} ${n.read ? "opacity-75" : ""}`}
              >
                <CardContent className="space-y-2.5 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {n.priority === "urgent" && (
                      <Badge variant="destructive" className="h-5 rounded-full px-2 text-[10px]">Urgent</Badge>
                    )}
                    {n.priority === "important" && (
                      <Badge className="h-5 rounded-full bg-warning/20 px-2 text-[10px] text-warning-foreground hover:bg-warning/20">
                        Important
                      </Badge>
                    )}
                    {n.priority === "general" && (
                      <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px]">General</Badge>
                    )}
                    {!n.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {n.sender} · {n.timestamp}
                    </span>
                  </div>
                  <h3 className="font-semibold leading-tight">{n.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{n.body}</p>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="h-8 rounded-full px-4">Acknowledge</Button>
                    <Button size="sm" variant="outline" className="h-8 rounded-full px-4">Reply</Button>
                    <Button size="sm" variant="ghost" className="ml-auto h-8 w-8 rounded-full p-0 text-muted-foreground">
                      {n.read ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="direct" className="mt-5">
          <Card className="overflow-hidden border-border/60 shadow-[0_1px_3px_0_oklch(0.2_0.04_255/5%)]">
            <CardContent className="divide-y divide-border/60 p-0">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3.5 p-4 transition-all hover:bg-muted/30 cursor-pointer ${m.unread ? "" : "opacity-70"}`}
                >
                  <Avatar className="h-10 w-10 shrink-0 ring-2 ring-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {m.from.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-sm ${m.unread ? "font-semibold" : "font-medium"}`}>{m.from}</p>
                      {m.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{m.time}</span>
                    </div>
                    <p className={`truncate text-sm ${m.unread ? "text-foreground" : "text-muted-foreground"}`}>
                      {m.subject}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{m.preview}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2.5 p-3.5">
                <input
                  placeholder="Write a message…"
                  className="h-10 flex-1 rounded-full border border-input bg-muted/40 px-4 text-sm outline-none transition focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Write a message"
                />
                <Button size="icon" className="h-10 w-10 shrink-0 rounded-full">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
