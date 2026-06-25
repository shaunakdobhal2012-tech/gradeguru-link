import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar as CalendarIcon,
  BookOpen,
  MessagesSquare,
  GraduationCap,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Assignments", url: "/assignments", icon: ClipboardList },
  { title: "Calendar", url: "/calendar", icon: CalendarIcon },
  { title: "Deadline Tetris", url: "/tetris", icon: Sparkles },
  { title: "Resources", url: "/resources", icon: BookOpen },
  { title: "Messages", url: "/messages", icon: MessagesSquare },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary shadow-sm text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-[0.9rem] font-bold tracking-tight">Scholaria</div>
            <div className="truncate text-[0.7rem] text-muted-foreground">Westwood High · Grade 11</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground/70 px-3 mb-1">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={`h-9 rounded-lg px-3 text-[0.85rem] font-medium transition-all duration-150 ${
                        active
                          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/95 hover:text-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Link to={item.url}>
                        <item.icon className={`h-4 w-4 shrink-0 ${active ? "opacity-100" : "opacity-70"}`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              className="h-9 rounded-lg px-3 text-[0.85rem] font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Settings className="h-4 w-4 opacity-70" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
