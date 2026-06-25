import { Bell, LogOut, Search, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const [dark, setDark] = useState(false);

  function toggleDark() {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  }

  const initials = (user?.initials ?? user?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()) ?? "AO";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/80 px-3 py-2 backdrop-blur-lg sm:px-5">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search…"
          className="h-9 w-full rounded-full border-border/60 bg-muted/50 pl-8 text-sm placeholder:text-muted-foreground/60 focus-visible:bg-background focus-visible:ring-1"
          aria-label="Global search"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={toggleDark}
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ml-1 flex items-center gap-2 rounded-full p-0.5 ring-offset-background transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Account menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="space-y-0.5">
              <div className="text-sm font-semibold leading-tight">{user?.name ?? "Guest"}</div>
              <div className="text-xs font-normal capitalize text-muted-foreground">
                {user?.role ?? "student"} · {user?.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => { void signOut(); }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
