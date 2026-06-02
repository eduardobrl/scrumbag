import type {
  Release,
  ReleaseBoardSummary,
  ReleaseFeatureBoardItem,
  Sprint,
} from "../domain/types";
import FeatureSplitSuggestion from "./FeatureSplitSuggestion";

interface ReleaseFeatureTimelineProps {
  release: Release;
  summary: ReleaseBoardSummary | null;
  onAllocate: (
    featureId: string,
    allocation: { start_sprint_id: string | null; end_sprint_id: string | null }
  ) => void;
  onRemoveFeature: (featureId: string) => void;
}

export default function ReleaseFeatureTimeline({
  release,
  summary,
  onAllocate,
  onRemoveFeature,
}: ReleaseFeatureTimelineProps) {
  if (!summary) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
        Carregando planejamento da release...
      </section>
    );
  }

  if (summary.sprints.length === 0) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
        Nenhum sprint nesta release. Crie o primeiro sprint para montar a timeline.
      </section>
    );
  }

  if (summary.features.length === 0) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-gray-900">Nenhuma feature nesta release</p>
        <p className="mt-1 text-sm text-gray-500">
          Crie uma feature ou arraste uma feature existente para planejar escopo, capacidade e previsao por sprint.
        </p>
      </section>
    );
  }

  const columns = `minmax(180px, 1.2fr) repeat(${summary.sprints.length}, minmax(160px, 1fr))`;

  return (
    <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="min-w-max p-4" style={{ display: "grid", gridTemplateColumns: columns, gap: 8 }}>
        <div className="sticky left-0 z-10 bg-white pb-2 text-xs font-semibold uppercase text-gray-500">
          Feature
        </div>
        {summary.sprints.map((sprint) => {
          const capacity = summary.sprint_capacities.find((item) => item.sprint_id === sprint.id);
          const over = capacity?.warnings.includes("sprint_over_capacity");
          return (
            <div key={sprint.id} className={`rounded-md border px-3 py-2 ${over ? "border-amber-200 bg-amber-50 text-amber-800" : "border-gray-200 bg-gray-50 text-gray-700"}`}>
              <p className="text-sm font-semibold">{sprint.goal}</p>
              <p className="mt-1 text-xs">{sprint.start_date} a {sprint.end_date}</p>
              <p className="mt-1 text-xs">
                {(capacity?.planned_days ?? 0).toFixed(1)} / {capacity?.available_days === null ? "--" : (capacity?.available_days ?? 0).toFixed(1)} dias
              </p>
            </div>
          );
        })}

        {summary.features.map((feature) => (
          <FeatureRow
            key={feature.feature.id}
            release={release}
            item={feature}
            sprints={summary.sprints}
            onAllocate={onAllocate}
            onRemoveFeature={onRemoveFeature}
          />
        ))}
      </div>
    </section>
  );
}

function FeatureRow({
  item,
  sprints,
  onAllocate,
  onRemoveFeature,
}: {
  release: Release;
  item: ReleaseFeatureBoardItem;
  sprints: Sprint[];
  onAllocate: ReleaseFeatureTimelineProps["onAllocate"];
  onRemoveFeature: ReleaseFeatureTimelineProps["onRemoveFeature"];
}) {
  const startIndex = item.allocation.start_sprint_id
    ? sprints.findIndex((sprint) => sprint.id === item.allocation.start_sprint_id)
    : -1;
  const endIndex = item.allocation.end_sprint_id
    ? sprints.findIndex((sprint) => sprint.id === item.allocation.end_sprint_id)
    : -1;

  function allocate(start: number, end: number) {
    if (start < 0 || end < 0 || start >= sprints.length || end >= sprints.length || start > end) return;
    onAllocate(item.feature.id, {
      start_sprint_id: sprints[start].id,
      end_sprint_id: sprints[end].id,
    });
  }

  return (
    <>
      <div className="sticky left-0 z-10 rounded-md border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.feature.title}</p>
            <p className="mt-1 text-xs text-gray-500">
              {item.story_count} historia(s), {item.bug_count} bug(s), {item.estimate_days.toFixed(1)} dias
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemoveFeature(item.feature.id)}
            className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
          >
            Remover
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <select
            value={startIndex >= 0 ? startIndex : ""}
            onChange={(event) => allocate(Number(event.target.value), endIndex >= 0 ? endIndex : Number(event.target.value))}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="">Inicio</option>
            {sprints.map((sprint, index) => (
              <option key={sprint.id} value={index}>{sprint.goal}</option>
            ))}
          </select>
          <select
            value={endIndex >= 0 ? endIndex : ""}
            onChange={(event) => allocate(startIndex >= 0 ? startIndex : Number(event.target.value), Number(event.target.value))}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="">Fim</option>
            {sprints.map((sprint, index) => (
              <option key={sprint.id} value={index}>{sprint.goal}</option>
            ))}
          </select>
        </div>
        {(startIndex >= 0 || endIndex >= 0) && (
          <button
            type="button"
            onClick={() => onAllocate(item.feature.id, { start_sprint_id: null, end_sprint_id: null })}
            className="mt-2 text-xs font-medium text-gray-600 hover:text-gray-900"
          >
            Remover alocacao
          </button>
        )}
        <FeatureSplitSuggestion suggestion={item.split_suggestion} />
      </div>

      {sprints.map((sprint, index) => {
        const active = startIndex >= 0 && endIndex >= 0 && index >= startIndex && index <= endIndex;
        const completes = item.predicted_completion_sprint_id === sprint.id;
        return (
          <div key={sprint.id} className={`min-h-24 rounded-md border p-3 ${active ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-gray-50"}`}>
            {active && (
              <>
                <p className="text-xs font-semibold text-blue-800">Planejada</p>
                {completes && (
                  <p className="mt-1 rounded bg-white px-2 py-1 text-xs text-blue-700">
                    Completa aqui
                  </p>
                )}
                {item.warnings.length > 0 && (
                  <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                    Escopo acima da capacidade ou estimativa incompleta.
                  </p>
                )}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
