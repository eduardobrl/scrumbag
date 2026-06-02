import type { BacklogItem, Release, ReleaseBoardSummary } from "../domain/types";

interface ReleaseFeatureBacklogProps {
  release: Release;
  summary: ReleaseBoardSummary | null;
  availableFeatures: BacklogItem[];
  onAddFeature: (featureId: string) => void;
  onCreateFeature: () => void;
}

export default function ReleaseFeatureBacklog({
  release,
  summary,
  availableFeatures,
  onAddFeature,
  onCreateFeature,
}: ReleaseFeatureBacklogProps) {
  const used = summary?.features.length ?? 0;

  return (
    <aside className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Features disponiveis</h3>
        <p className="mt-1 text-xs text-gray-500">
          {used} feature(s) na release. Adicione escopo sem sair do planejamento.
        </p>
      </div>

      {availableFeatures.length === 0 ? (
        <div className="p-4">
          <p className="text-sm font-medium text-gray-900">Nenhuma feature disponivel</p>
          <p className="mt-1 text-xs text-gray-500">
            Crie uma feature para planejar escopo, capacidade e previsao por sprint.
          </p>
          <button
            type="button"
            onClick={onCreateFeature}
            className="mt-3 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Criar feature
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {availableFeatures.map((feature) => (
            <article key={feature.id} className="p-4">
              <p className="text-sm font-medium text-gray-900">{feature.title}</p>
              <p className="mt-1 text-xs text-gray-500">{feature.status}</p>
              {release.status === "active" && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                  Esta release esta em execucao. A feature sera adicionada com aviso.
                </p>
              )}
              <button
                type="button"
                onClick={() => onAddFeature(feature.id)}
                className="mt-3 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Adicionar feature a release
              </button>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}
