import { useEffect, useState } from "react";
import type { BacklogItem, NewBacklogItem } from "../domain/types";
import BacklogForm from "./BacklogForm";
import FeatureCard from "./FeatureCard";

interface FeatureFirstBacklogProps {
  items: BacklogItem[];
  editingItem: BacklogItem | null;
  onCreate: (item: NewBacklogItem) => void;
  onUpdate: (item: NewBacklogItem) => void;
  onEdit: (item: BacklogItem) => void;
  onDelete: (id: string) => void;
  onCancelEdit: () => void;
  refreshKey?: number;
}

export default function FeatureFirstBacklog({
  items,
  editingItem,
  onCreate,
  onUpdate,
  onEdit,
  onDelete,
  onCancelEdit,
  refreshKey,
}: FeatureFirstBacklogProps) {
  const [features, setFeatures] = useState<BacklogItem[]>([]);

  useEffect(() => {
    setFeatures(items.filter((item) => item.type === "feature"));
  }, [items]);

  const editingFeature = editingItem?.type === "feature" ? editingItem : null;
  const editingChild = editingItem && editingItem.type !== "feature" ? editingItem : null;
  const parentFeature = editingChild
    ? features.find((feature) => feature.id === editingChild.parent_id) ?? null
    : null;

  return (
    <div>
      {editingChild && parentFeature ? (
        <BacklogForm
          mode="child"
          initialItem={editingChild}
          parentFeature={parentFeature}
          onSubmit={onUpdate}
          onCancel={onCancelEdit}
        />
      ) : (
        <BacklogForm
          mode="feature"
          initialItem={editingFeature}
          onSubmit={editingFeature ? onUpdate : onCreate}
          onCancel={editingFeature ? onCancelEdit : undefined}
        />
      )}

      <div className="space-y-4">
        {features.length === 0 ? (
          <section className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-gray-900">Nenhuma feature no backlog</p>
            <p className="mt-1 text-sm text-gray-500">
              Crie uma feature e depois adicione historias ou bugs dentro dela.
            </p>
          </section>
        ) : (
          features.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onCreateChild={onCreate}
              onEdit={onEdit}
              onDelete={onDelete}
              refreshKey={refreshKey}
            />
          ))
        )}
      </div>
    </div>
  );
}
