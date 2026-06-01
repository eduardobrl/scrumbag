import { useState, useEffect, useCallback } from "react";
import type { AggregateEstimate, BacklogItem } from "../domain/types";
import SortableItem from "./SortableItem";
import SortableList from "./SortableList";

interface BacklogListProps {
  items: BacklogItem[];
  onEdit: (item: BacklogItem) => void;
  onDelete: (id: string) => void;
  refreshKey?: number;
}

const typeLabels: Record<string, string> = {
  epic: "Epico",
  feature: "Feature",
  story: "Historia",
  bug: "Bug",
};

const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  in_progress: "Em Progresso",
  done: "Concluido",
};

const statusColors: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

interface TreeItemProps {
  item: BacklogItem;
  depth: number;
  onEdit: (item: BacklogItem) => void;
  onDelete: (id: string) => void;
  refreshKey?: number;
}

function BacklogTreeItem({ item, depth, onEdit, onDelete, refreshKey }: TreeItemProps) {
  const [children, setChildren] = useState<BacklogItem[]>([]);
  const [aggregate, setAggregate] = useState<AggregateEstimate | null>(null);
  const [expanded, setExpanded] = useState(true);

  const fetchChildren = useCallback(async () => {
    try {
      const res = await fetch(`/api/backlog?parent_id=${item.id}`);
      const data = await res.json();
      setChildren(Array.isArray(data) ? data : []);
    } catch {
      setChildren([]);
    }
  }, [item.id]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren, refreshKey]);

  useEffect(() => {
    if (item.type === "story" || item.type === "bug") {
      setAggregate(null);
      return;
    }

    fetch(`/api/backlog/${item.id}/aggregate-estimate`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setAggregate(data))
      .catch(() => setAggregate(null));
  }, [item.id, item.type, refreshKey]);

  function handleDelete(id: string) {
    if (window.confirm("Tem certeza que deseja excluir este item?")) {
      onDelete(id);
    }
  }

  async function handleChildReorder(ids: string[]) {
    const ordered = ids
      .map((id) => children.find((child) => child.id === id))
      .filter((child): child is BacklogItem => Boolean(child));
    setChildren(ordered);
    await persistPriorityOrder(ids);
  }

  const hasChildren = children.length > 0;
  const estimateText =
    item.type === "story" || item.type === "bug"
      ? formatEstimate(item.story_points, item.estimate_days)
      : aggregate
        ? formatEstimate(aggregate.story_points, aggregate.estimate_days)
        : "Sem estimativa";

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 hover:bg-gray-50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="h-7 w-7 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-0"
          disabled={!hasChildren}
          aria-label={expanded ? "Recolher" : "Expandir"}
        >
          {expanded ? "v" : ">"}
        </button>

        <div className="min-w-0 flex-1" style={{ paddingLeft: `${depth * 16}px` }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
              {typeLabels[item.type] ?? item.type}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[item.status] ?? "bg-gray-100 text-gray-700"}`}
            >
              {statusLabels[item.status] ?? item.status}
            </span>
            <span className="text-xs text-gray-500">{estimateText}</span>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-gray-900">{item.title}</p>
        </div>

        <button
          onClick={() => onEdit(item)}
          className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
        >
          Editar
        </button>
        <button
          onClick={() => handleDelete(item.id)}
          className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
        >
          Excluir
        </button>
      </div>

      {expanded && children.length > 0 && (
        <SortableList ids={children.map((child) => child.id)} onReorder={handleChildReorder}>
          {children.map((child) => (
            <SortableItem key={child.id} id={child.id}>
              {(handleProps) => (
                <div>
                  <button
                    type="button"
                    {...handleProps.attributes}
                    {...handleProps.listeners}
                    className="ml-8 mt-1 cursor-grab rounded bg-gray-100 px-2 py-1 text-xs text-gray-500 active:cursor-grabbing"
                  >
                    Arrastar
                  </button>
                  <BacklogTreeItem
                    item={child}
                    depth={depth + 1}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    refreshKey={refreshKey}
                  />
                </div>
              )}
            </SortableItem>
          ))}
        </SortableList>
      )}
    </div>
  );
}

export default function BacklogList({ items, onEdit, onDelete, refreshKey }: BacklogListProps) {
  const [orderedItems, setOrderedItems] = useState<BacklogItem[]>(items);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  async function handleRootReorder(ids: string[]) {
    const ordered = ids
      .map((id) => orderedItems.find((item) => item.id === id))
      .filter((item): item is BacklogItem => Boolean(item));
    setOrderedItems(ordered);
    // Reorder is scoped to siblings/root items so hierarchy parentage is never changed.
    await persistPriorityOrder(ids);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {orderedItems.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500">
          Nenhum item no backlog ainda.
        </p>
      ) : (
        <SortableList ids={orderedItems.map((item) => item.id)} onReorder={handleRootReorder}>
          {orderedItems.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {(handleProps) => (
                <div>
                  <button
                    type="button"
                    {...handleProps.attributes}
                    {...handleProps.listeners}
                    className="ml-4 mt-2 cursor-grab rounded bg-gray-100 px-2 py-1 text-xs text-gray-500 active:cursor-grabbing"
                  >
                    Arrastar
                  </button>
                  <BacklogTreeItem
                    item={item}
                    depth={0}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    refreshKey={refreshKey}
                  />
                </div>
              )}
            </SortableItem>
          ))}
        </SortableList>
      )}
    </div>
  );
}

async function persistPriorityOrder(ids: string[]) {
  const highest = ids.length;
  await fetch("/api/backlog/reorder", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: ids.map((id, index) => ({
        id,
        priority: highest - index,
      })),
    }),
  });
}

function formatEstimate(storyPoints: number | null, estimateDays: number | null): string {
  if (!storyPoints && !estimateDays) {
    return "Sem estimativa";
  }

  const parts: string[] = [];
  if (storyPoints) parts.push(`${storyPoints} pts`);
  if (estimateDays) parts.push(`${estimateDays} dias`);
  return parts.join(" / ");
}
