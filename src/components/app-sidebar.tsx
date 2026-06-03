"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { navigationItems } from "@/lib/navigation";

export function AppSidebar() {
  const pathname = usePathname();

  return (
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
  );
}
