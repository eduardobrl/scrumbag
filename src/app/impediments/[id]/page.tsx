import Link from "next/link";
import { notFound } from "next/navigation";
import { ImpedimentDetail } from "@/features/impediments/impediment-detail";
import { getImpedimentDetail, toImpedimentView } from "@/lib/impediments";

export default async function ImpedimentDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ releaseId?: string }>;
}) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const impediment = await getImpedimentDetail(id);

  if (!impediment) {
    notFound();
  }

  const view = toImpedimentView(impediment);
  const releaseId = sp.releaseId ?? view.releaseId ?? undefined;

  return (
    <div className="space-y-5">
      <Link
        className="inline-flex text-sm font-medium text-accent hover:text-teal-800"
        href={`/impediments${releaseId ? `?releaseId=${encodeURIComponent(releaseId)}` : ""}`}
      >
        Voltar para impedimentos
      </Link>
      <ImpedimentDetail impediment={view} releaseId={releaseId} />
    </div>
  );
}
