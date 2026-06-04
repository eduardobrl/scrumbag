import { Suspense } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-panel text-ink">
      <Suspense fallback={<div className="fixed inset-y-0 left-0 z-20 w-64 border-r border-line bg-white" />}>
        <AppSidebar />
      </Suspense>
      <div className="pl-64">
        <Suspense fallback={<header className="sticky top-0 z-10 h-16 border-b border-line bg-white px-6" />}>
          <AppHeader />
        </Suspense>
        <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
