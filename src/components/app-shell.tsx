"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/badge";
import { navigationItems } from "@/lib/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-panel text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-line bg-white">
        <div className="flex h-16 items-center border-b border-line px-5">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-accent">Squad Planner</div>
            <div className="text-xs text-slate-500">Local release cockpit</div>
          </div>
        </div>
        <nav className="space-y-1 p-3" aria-label="Primary navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium",
                  active ? "bg-teal-50 text-accent" : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-white px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">Active release</span>
            <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span className="font-semibold">No active release</span>
            <Badge>Not configured</Badge>
            <Badge tone="warning">Capacity: --</Badge>
          </div>
          <Link
            href="/assistant"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            <Bot className="h-4 w-4" aria-hidden="true" />
            Assistant AI
          </Link>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
