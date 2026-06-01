import { useEffect, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { BacklogItem, Sprint } from "../domain/types";

interface SprintBacklogPickerProps {
  sprint: Sprint;
  refreshKey: number;
  onChanged: () => void;
}

const typeLabels: Record<string, string> = {
  story: "Historia",
  bug: "Bug",
};

export function SprintBacklogPicker({
  sprint,
  refreshKey,
  onChanged,
}: SprintBacklogPickerProps) {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/sprints/${sprint.id}/available-backlog`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, [sprint.id, refreshKey]);

  async function handleAdd(item: BacklogItem) {
    setError("");
    const res = await fetch(`/api/sprints/${sprint.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backlog_item_id: item.id }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Nao foi possivel adicionar o item.");
      return;
    }

    onChanged();
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Backlog elegivel</h3>
        <p className="mt-1 text-xs text-gray-500">
          Apenas historias e bugs podem entrar no sprint.
        </p>
      </div>

      {error && (
        <p className="mx-4 mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="divide-y divide-gray-200">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">
            Nenhum item disponivel.
          </p>
        ) : (
          items.map((item) => (
            <AvailableBacklogItem key={item.id} item={item} onAdd={handleAdd} />
          ))
        )}
      </div>
    </section>
  );
}

function AvailableBacklogItem({
  item,
  onAdd,
}: {
  item: BacklogItem;
  onAdd: (item: BacklogItem) => void;
}) {
  const draggable = useDraggable({
    id: `candidate-${item.id}`,
    data: { candidate: item },
  });

  const style = draggable.transform
    ? {
        transform: `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={draggable.setNodeRef}
      style={style}
      className="flex items-center justify-between gap-3 px-4 py-3"
    >
      <div>
        <button
          type="button"
          {...draggable.listeners}
          {...draggable.attributes}
          className="cursor-grab text-left active:cursor-grabbing"
        >
          <p className="text-sm font-medium text-gray-900">{item.title}</p>
          <p className="mt-1 text-xs text-gray-500">
            {typeLabels[item.type]} - {formatEstimate(item)}
          </p>
        </button>
      </div>
      <button
        onClick={() => onAdd(item)}
        className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
      >
        Adicionar
      </button>
    </div>
  );
}

function formatEstimate(item: BacklogItem): string {
  const parts: string[] = [];
  if (item.story_points) parts.push(`${item.story_points} pts`);
  if (item.estimate_days) parts.push(`${item.estimate_days} dias`);
  return parts.length > 0 ? parts.join(" / ") : "sem estimativa";
}

export default SprintBacklogPicker;
