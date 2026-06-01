import { useEffect, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Sprint, SprintItem } from "../domain/types";
import SortableItem from "./SortableItem";
import SortableList from "./SortableList";

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
  const droppable = useDroppable({ id: "sprint-scope-drop" });

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

  async function handleReorder(ids: string[]) {
    const orderedItems = ids
      .map((id) => items.find((item) => item.backlog_item_id === id))
      .filter((item): item is SprintItem => Boolean(item));
    setItems(orderedItems);

    const res = await fetch(`/api/sprints/${sprint.id}/items/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: ids.map((id, index) => ({
          backlog_item_id: id,
          sprint_order: index,
        })),
      }),
    });

    if (!res.ok) {
      setError("Nao foi possivel salvar a ordem do sprint.");
      onChanged();
    }
  }

  return (
    <section
      ref={droppable.setNodeRef}
      className={`rounded-lg border bg-white shadow-sm ${
        droppable.isOver ? "border-blue-400" : "border-gray-200"
      }`}
    >
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
          <SortableList
            ids={items.map((item) => item.backlog_item_id)}
            onReorder={handleReorder}
          >
            {items.map((item) => (
              <SortableItem key={item.backlog_item_id} id={item.backlog_item_id}>
                {(handleProps) => (
                  <ScopeItem item={item} onRemove={handleRemove} handleProps={handleProps} />
                )}
              </SortableItem>
            ))}
          </SortableList>
        )}
      </div>
    </section>
  );
}

function ScopeItem({
  item,
  onRemove,
  handleProps,
}: {
  item: SprintItem;
  onRemove: (item: SprintItem) => void;
  handleProps: {
    attributes: Record<string, unknown>;
    listeners: Record<string, unknown> | undefined;
  };
}) {
  const backlogItem = item.backlog_item;
  const missingEstimate = !backlogItem?.story_points || !backlogItem?.estimate_days;

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          {...handleProps.attributes}
          {...handleProps.listeners}
          className="cursor-grab text-left active:cursor-grabbing"
        >
          <p className="text-sm font-medium text-gray-900">
            {backlogItem?.title ?? item.backlog_item_id}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {statusLabels[backlogItem?.status ?? "backlog"]} - {formatEstimate(item)}
          </p>
        </button>
        <button
          onClick={() => onRemove(item)}
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
