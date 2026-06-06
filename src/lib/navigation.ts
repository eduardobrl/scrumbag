import {
  Bot,
  CalendarRange,
  ClipboardList,
  CircleAlert,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Settings,
  Users,
  Workflow
} from "lucide-react";

export const navigationItems = [
  { labelKey: "dashboard", href: "/", icon: LayoutDashboard },
  { labelKey: "releases", href: "/releases", icon: CalendarRange },
  { labelKey: "features", href: "/features", icon: Workflow },
  { labelKey: "backlog", href: "/backlog", icon: ClipboardList },
  { labelKey: "sprints", href: "/sprints", icon: ListChecks },
  { labelKey: "impediments", href: "/impediments", icon: CircleAlert },
  { labelKey: "squad", href: "/squad", icon: Users },
  { labelKey: "reports", href: "/reports", icon: Gauge },
  { labelKey: "assistant", href: "/assistant", icon: Bot },
  { labelKey: "settings", href: "/settings", icon: Settings }
] as const;
