import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-panel text-ink">
      <AppSidebar />
      <div className="pl-64">
        <AppHeader />
        <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
