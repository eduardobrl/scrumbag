import {
  Bot,
  CalendarRange,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Settings,
  Users,
  Workflow
} from "lucide-react";

export const navigationItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Releases", href: "/releases", icon: CalendarRange },
  { label: "Features/Stories", href: "/features", icon: Workflow },
  { label: "Backlog", href: "/backlog", icon: ClipboardList },
  { label: "Sprints", href: "/sprints", icon: ListChecks },
  { label: "Squad", href: "/squad", icon: Users },
  { label: "Reports", href: "/reports", icon: Gauge },
  { label: "Assistant AI", href: "/assistant", icon: Bot },
  { label: "Settings", href: "/settings", icon: Settings }
] as const;
