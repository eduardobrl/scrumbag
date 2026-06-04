import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReportList } from "@/features/reports/report-list";
import { getReleaseForView, listReleases } from "@/lib/releases";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams
}: {
  searchParams?: Promise<{ releaseId?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const [releases, activeRelease] = await Promise.all([listReleases(), getReleaseForView(sp.releaseId)]);
  const releaseOptions = releases.map((release) => ({
    id: release.id,
    name: release.name,
    status: release.status
  }));
  const defaultReleaseId = activeRelease?.id ?? releaseOptions[0]?.id ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Relatórios</h1>
        <p className="mt-1 text-sm text-slate-600">Gere exportações de planejamento, capacidade, progresso, vazamento e timeline.</p>
      </div>

      {releaseOptions.length === 0 ? (
        <Card>
          <h2 className="text-base font-semibold text-ink">Nenhuma release disponível</h2>
          <p className="mt-2 text-sm text-slate-600">Crie uma release antes de gerar relatórios.</p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/releases">Abrir releases</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <ReportList releases={releaseOptions} defaultReleaseId={defaultReleaseId} />
      )}
    </div>
  );
}
