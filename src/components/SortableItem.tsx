import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
  id: string;
  disabled?: boolean;
  children: (handleProps: {
    attributes: ReturnType<typeof useSortable>["attributes"];
    listeners: ReturnType<typeof useSortable>["listeners"];
  }) => ReactNode;
}

export function SortableItem({ id, disabled, children }: SortableItemProps) {
  const sortable = useSortable({ id, disabled });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.6 : 1,
  };

  return (
    <div ref={sortable.setNodeRef} style={style}>
      {children({
        attributes: sortable.attributes,
        listeners: sortable.listeners,
      })}
    </div>
  );
}

export default SortableItem;
