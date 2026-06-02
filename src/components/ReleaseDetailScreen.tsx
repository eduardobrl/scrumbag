import { useEffect, useState } from "react";
import type {
  BacklogItem,
  NewSprint,
  Release,
  ReleaseBoardSummary,
  Sprint,
} from "../domain/types";
import ReleaseCapacitySummary from "./ReleaseCapacitySummary";
import ReleaseFeatureBacklog from "./ReleaseFeatureBacklog";
import ReleaseFeatureTimeline from "./ReleaseFeatureTimeline";
import SprintForm from "./SprintForm";
import SprintList from "./SprintList";

type ReleaseTab = "features" | "sprints" | "capacity" | "forecast";

interface ReleaseDetailScreenProps {
  release: Release;
  onBack: () => void;
  onOpenSprint: (sprint: Sprint, release: Release) => void;
  onCreateFeature: () => void;
}

const statusLabels: Record<Release["status"], string> = {
  planned: "Planejada",
  active: "Ativa",
  closed: "Fechada",
};

export default function ReleaseDetailScreen({
  release,
  onBack,
  onOpenSprint,
  onCreateFeature,
}: ReleaseDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<ReleaseTab>("features");
  const [summary, setSummary] = useState<ReleaseBoardSummary | null>(null);
  const [availableFeatures, setAvailableFeatures] = useState<BacklogItem[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refreshAll();
  }, [release.id]);

  async function refreshAll() {
    setLoading(true);
    setError("");
    try {
      const [boardRes, availableRes, sprintsRes] = await Promise.all([
        fetch(`/api/releases/${release.id}/board`),
        fetch(`/api/releases/${release.id}/features?available=true`),
        fetch(`/api/releases/${release.id}/sprints`),
      ]);
      setSummary(boardRes.ok ? await boardRes.json() : null);
      setAvailableFeatures(availableRes.ok ? await availableRes.json() : []);
      setSprints(sprintsRes.ok ? await sprintsRes.json() : []);
      if (!boardRes.ok) {
        setError("Nao foi possivel atualizar o planejamento da release. Revise a feature, o sprint de destino e tente novamente.");
      }
    } catch {
      setError("Nao foi possivel atualizar o planejamento da release. Revise a feature, o sprint de destino e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSprint(sprint: NewSprint) {
    const res = await fetch(`/api/releases/${release.id}/sprints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sprint),
    });
    if (!res.ok) {
      setError("Nao foi possivel criar sprint da release.");
      return;
    }
    await refreshAll();
  }

  async function handleAddFeature(featureId: string) {
    const res = await fetch(`/api/releases/${release.id}/features`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature_id: featureId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Nao foi possivel adicionar feature a release.");
      return;
    }
    await refreshAll();
  }

  async function handleRemoveFeature(featureId: string) {
    if (
      !window.confirm(
        "Remover esta feature da release tambem remove sua alocacao na timeline."
      )
    ) {
      return;
    }
    const res = await fetch(`/api/releases/${release.id}/features/${featureId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("Nao foi possivel remover feature da release.");
      return;
    }
    await refreshAll();
  }

  async function handleAllocate(
    featureId: string,
    allocation: { start_sprint_id: string | null; end_sprint_id: string | null }
  ) {
    const res = await fetch(`/api/releases/${release.id}/features/${featureId}/allocation`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(allocation),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Nao foi possivel atualizar o planejamento da release.");
      return;
    }
    await refreshAll();
  }

  const tabs: { id: ReleaseTab; label: string }[] = [
    { id: "features", label: "Features" },
    { id: "sprints", label: "Sprints" },
    { id: "capacity", label: "Capacity" },
    { id: "forecast", label: "Forecast" },
  ];

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-4 text-sm font-medium text-blue-600 hover:text-blue-700">
        Voltar para releases
      </button>

      <header className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight text-gray-900">{release.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {release.start_date} a {release.end_date}
            </p>
          </div>
          <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {statusLabels[release.status]}
          </span>
        </div>
      </header>

      <div className="mb-4">
        <ReleaseCapacitySummary summary={summary} />
      </div>

      {loading && <p className="mb-3 text-sm text-gray-500">Atualizando release...</p>}
      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mb-5 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 text-sm font-medium ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "features" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <ReleaseFeatureBacklog
            release={release}
            summary={summary}
            availableFeatures={availableFeatures}
            onAddFeature={handleAddFeature}
            onCreateFeature={onCreateFeature}
          />
          <ReleaseFeatureTimeline
            release={release}
            summary={summary}
            onAllocate={handleAllocate}
            onRemoveFeature={handleRemoveFeature}
          />
        </div>
      )}

      {activeTab === "sprints" && (
        <div>
          <SprintForm onSubmit={handleCreateSprint} />
          <SprintList
            sprints={sprints}
            selectedSprintId={null}
            onSelect={(sprint) => onOpenSprint(sprint, release)}
            onEdit={() => setError("Edicao de sprint sera feita no detalhe do sprint.")}
            onDelete={() => setError("Exclusao de sprint deve ser revisada no detalhe do sprint.")}
          />
        </div>
      )}

      {activeTab === "capacity" && <ReleaseCapacitySummary summary={summary} />}

      {activeTab === "forecast" && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
          Forecast detalhado fica para a fase 5. A previsao por feature ja aparece na timeline.
        </section>
      )}
    </div>
  );
}
