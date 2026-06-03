export function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-normal text-ink">{title}</h1>
      <p className="max-w-2xl text-sm text-slate-600">
        This section is planned for {phase}. Phase 1 keeps the route available so navigation stays stable while the local
        foundation is built.
      </p>
    </div>
  );
}
