import { useState, useEffect, useCallback } from "react";
import type { AggregateEstimate, BacklogItem } from "../domain/types";

interface BacklogListProps {
  items: BacklogItem[];
  onEdit: (item: BacklogItem) => void;
  onDelete: (id: string) => void;
  refreshKey?: number;
}

const typeLabels: Record<string, string> = {
  epic: "Épico",
  feature: "Feature",
  story: "História",
  bug: "Bug",
};

const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  in_progress: "Em Progresso",
  done: "Concluído",
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

  const indentClass = depth === 0 ? "" : `pl-${Math.min(depth * 4, 12)}`;
  const hasChildren = children.length > 0;
  const estimateText =
    item.type === "story" || item.type === "bug"
      ? formatEstimate(item.story_points, item.estimate_days)
      : aggregate
        ? formatEstimate(aggregate.story_points, aggregate.estimate_days)
        : "Sem estimativa";

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="whitespace-nowrap px-4 py-3">
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={expanded ? "Recolher" : "Expandir"}
              >
                {expanded ? "▼" : "▶"}
              </button>
            )}
            {!hasChildren && <span className="w-4" />}
            <span
              className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
              style={{ marginLeft: `${depth * 16}px` }}
            >
              {typeLabels[item.type] ?? item.type}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm font-medium text-gray-900" style={{ paddingLeft: `${16 + depth * 16}px` }}>
          {item.title}
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[item.status] ?? "bg-gray-100 text-gray-700"}`}
          >
            {statusLabels[item.status] ?? item.status}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
          {estimateText}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
          <button
            onClick={() => onEdit(item)}
            className="mr-2 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
          >
            Editar
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
          >
            Excluir
          </button>
        </td>
      </tr>
      {expanded &&
        children.map((child) => (
            <BacklogTreeItem
                key={child.id}
                item={child}
                depth={depth + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                refreshKey={refreshKey}
              />
        ))}
    </>
  );
}

export default function BacklogList({ items, onEdit, onDelete, refreshKey }: BacklogListProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Título
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Estimativa
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                Nenhum item no backlog ainda.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <BacklogTreeItem
                key={item.id}
                item={item}
                depth={0}
                onEdit={onEdit}
                onDelete={onDelete}
                refreshKey={refreshKey}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatEstimate(storyPoints: number | null, estimateDays: number | null): string {
  if (!storyPoints && !estimateDays) {
    return "Sem estimativa";
  }

  const parts: string[] = [];
  if (storyPoints) {
    parts.push(`${storyPoints} pts`);
  }
  if (estimateDays) {
    parts.push(`${estimateDays} dias`);
  }
  return parts.join(" / ");
}
