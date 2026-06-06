import Link from "next/link";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { ResolveImpedimentForm } from "@/features/impediments/resolve-impediment-form";

export type ImpedimentDetailView = {
  id: string;
  title: string;
  description: string;
  reportedDate: string;
  resolutionDate: string | null;
  resolutionNotes: string;
  status: string;
  releaseId: string | null;
  affectedStories: Array<{
    id: string;
    title: string;
    featureId: string;
  }>;
  impact: {
    storyCount: number;
    estimatedDays: number;
    blockedBusinessDays: number;
  };
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Aberto",
  RESOLVED: "Resolvido"
};

function ImpactCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="text-xs font-medium uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}

export function ImpedimentDetail({ impediment, releaseId }: { impediment: ImpedimentDetailView; releaseId?: string }) {
  const releaseQuery = releaseId ? `?releaseId=${encodeURIComponent(releaseId)}` : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        <div className="rounded-lg border border-line bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Detalhe do impedimento</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-ink">{impediment.title}</h1>
            </div>
            <Badge tone={impediment.status === "RESOLVED" ? "success" : "warning"}>
              {STATUS_LABEL[impediment.status] ?? impediment.status}
            </Badge>
          </div>

          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Registro</dt>
              <dd className="mt-1 text-sm text-slate-800">{impediment.reportedDate}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Resolucao</dt>
              <dd className="mt-1 text-sm text-slate-800">{impediment.resolutionDate ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Status</dt>
              <dd className="mt-1 text-sm text-slate-800">{STATUS_LABEL[impediment.status] ?? impediment.status}</dd>
            </div>
          </dl>

          <div className="mt-5 space-y-2">
            <h2 className="text-sm font-semibold uppercase text-slate-500">Descricao</h2>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {impediment.description || "Sem descricao."}
            </p>
          </div>

          {impediment.resolutionDate && (
            <div className="mt-5 space-y-2">
              <h2 className="text-sm font-semibold uppercase text-slate-500">Notas da resolucao</h2>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {impediment.resolutionNotes || "Sem notas."}
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ImpactCard label="Historias" value={impediment.impact.storyCount} />
          <ImpactCard label="Dias estimados" value={`${impediment.impact.estimatedDays}d`} />
          <ImpactCard label="Dias bloqueados" value={`${impediment.impact.blockedBusinessDays}d`} />
        </div>

        <div className="rounded-lg border border-line bg-white p-4">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Historias afetadas</h2>
          <div className="mt-3 divide-y divide-line">
            {impediment.affectedStories.map((story) => (
              <Link
                key={story.id}
                className="block py-2 text-sm font-medium text-accent hover:text-teal-800"
                href={`/stories/${story.id}/edit${releaseQuery}`}
              >
                {story.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        {impediment.status === "OPEN" ? (
          <ResolveImpedimentForm impedimentId={impediment.id} defaultResolutionDate={new Date().toISOString().slice(0, 10)} />
        ) : (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Impedimento resolvido. A resolucao e final.
          </div>
        )}
      </aside>
    </div>
  );
}
