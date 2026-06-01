import { useEffect, useState } from "react";
import type { Sprint, SprintItem } from "../domain/types";

interface SprintScopePanelProps {
  sprint: Sprint;
  refreshKey: number;
  onChanged: () => void;
}

const statusLabels: Record<string, string> = {
  backlog: "To Do",
  in_progress: "Em progresso",
  done: "Done",
};

export function SprintScopePanel({
  sprint,
  refreshKey,
  onChanged,
}: SprintScopePanelProps) {
  const [items, setItems] = useState<SprintItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/sprints/${sprint.id}/items`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, [sprint.id, refreshKey]);

  async function handleRemove(item: SprintItem) {
    setError("");
    const res = await fetch(`/api/sprints/${sprint.id}/items/${item.backlog_item_id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Nao foi possivel remover o item.");
      return;
    }

    onChanged();
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Escopo do sprint</h3>
        <p className="mt-1 text-xs text-gray-500">{sprint.goal}</p>
      </div>

      {error && (
        <p className="mx-4 mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="divide-y divide-gray-200">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">
            Nenhum item no sprint.
          </p>
        ) : (
          items.map((item) => {
            const backlogItem = item.backlog_item;
            const missingEstimate = !backlogItem?.story_points || !backlogItem?.estimate_days;
            return (
              <div key={item.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {backlogItem?.title ?? item.backlog_item_id}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {statusLabels[backlogItem?.status ?? "backlog"]} - {formatEstimate(item)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(item)}
                    className="shrink-0 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Remover
                  </button>
                </div>
                {missingEstimate && (
                  <p className="mt-2 rounded-md bg-yellow-50 px-2 py-1 text-xs text-yellow-800">
                    Estimativa incompleta. O item pode ficar no sprint, mas nao conta totalmente nos totais.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function formatEstimate(item: SprintItem): string {
  const backlogItem = item.backlog_item;
  if (!backlogItem) return "sem estimativa";

  const parts: string[] = [];
  if (backlogItem.story_points) parts.push(`${backlogItem.story_points} pts`);
  if (backlogItem.estimate_days) parts.push(`${backlogItem.estimate_days} dias`);
  return parts.length > 0 ? parts.join(" / ") : "sem estimativa";
}

export default SprintScopePanel;
