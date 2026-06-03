import { ReleaseForm } from "@/features/releases/release-form";
import { ReleaseList } from "@/features/releases/release-list";
import { listReleases, toReleaseView } from "@/lib/releases";

export default async function ReleasesPage() {
  const releases = await listReleases();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Releases</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">New release</h2>
          <ReleaseForm />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Releases ({releases.length})
          </h2>
          <ReleaseList releases={releases.map(toReleaseView)} />
        </section>
      </div>
    </div>
  );
}
