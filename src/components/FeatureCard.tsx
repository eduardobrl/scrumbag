import { useEffect, useState } from "react";
import type { AggregateEstimate, BacklogItem, NewBacklogItem } from "../domain/types";
import BacklogForm from "./BacklogForm";

interface FeatureCardProps {
  feature: BacklogItem;
  onCreateChild: (item: NewBacklogItem) => void;
  onEdit: (item: BacklogItem) => void;
  onDelete: (id: string) => void;
  refreshKey?: number;
}

export default function FeatureCard({
  feature,
  onCreateChild,
  onEdit,
  onDelete,
  refreshKey,
}: FeatureCardProps) {
  const [children, setChildren] = useState<BacklogItem[]>([]);
  const [aggregate, setAggregate] = useState<AggregateEstimate | null>(null);
  const [addingChild, setAddingChild] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/backlog?parent_id=${feature.id}`).then((res) => res.json()),
      fetch(`/api/backlog/${feature.id}/aggregate-estimate`).then((res) => res.json()),
    ])
      .then(([childData, aggregateData]) => {
        setChildren(Array.isArray(childData) ? childData : []);
        setAggregate(aggregateData);
      })
      .catch(() => {
        setChildren([]);
        setAggregate(null);
      });
  }, [feature.id, refreshKey]);

  function handleDelete(id: string) {
    if (window.confirm("Excluir este item?")) onDelete(id);
  }

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{feature.title}</p>
          <p className="mt-1 text-xs text-gray-500">
            {children.length} item(ns) - {aggregate?.story_points ?? 0} pts / {aggregate?.estimate_days ?? 0} dias
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAddingChild((value) => !value)} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
            Adicionar historia ou bug
          </button>
          <button onClick={() => onEdit(feature)} className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100">
            Editar
          </button>
          <button onClick={() => handleDelete(feature.id)} className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100">
            Excluir
          </button>
        </div>
      </div>

      {addingChild && (
        <div className="mt-4">
          <BacklogForm
            mode="child"
            parentFeature={feature}
            onSubmit={(item) => {
              onCreateChild(item);
              setAddingChild(false);
            }}
            onCancel={() => setAddingChild(false)}
          />
        </div>
      )}

      <div className="mt-4 divide-y divide-gray-100">
        {children.length === 0 ? (
          <p className="py-3 text-sm text-gray-500">Nenhuma historia ou bug nesta feature.</p>
        ) : (
          children.map((child) => (
            <div key={child.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{child.title}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {child.type} - {child.story_points ?? 0} pts / {child.estimate_days ?? 0} dias
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEdit(child)} className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100">
                  Editar
                </button>
                <button onClick={() => handleDelete(child.id)} className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100">
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
