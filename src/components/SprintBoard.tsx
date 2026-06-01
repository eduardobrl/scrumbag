import { useEffect, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type {
  BacklogItemStatus,
  Sprint,
  SprintItem,
  SprintPlanningTotals,
} from "../domain/types";
import CompletionDateDialog from "./CompletionDateDialog";
import SprintClosePanel from "./SprintClosePanel";

interface SprintBoardProps {
  sprint: Sprint;
  refreshKey?: number;
  onSprintChanged: (sprint: Sprint) => void;
}

const columns: { status: BacklogItemStatus; title: string }[] = [
  { status: "backlog", title: "Backlog" },
  { status: "in_progress", title: "In Progress" },
  { status: "done", title: "Done" },
];

export function SprintBoard({
  sprint,
  refreshKey = 0,
  onSprintChanged,
}: SprintBoardProps) {
  const [items, setItems] = useState<SprintItem[]>([]);
  const [totals, setTotals] = useState<SprintPlanningTotals | null>(null);
  const [pendingDone, setPendingDone] = useState<{
    itemId: string;
    targetStatus: BacklogItemStatus;
    overItemId: string | null;
  } | null>(null);
  const closed = sprint.status === "closed";
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    refreshBoard();
  }, [sprint.id, refreshKey]);

  async function refreshBoard() {
    const [boardRes, totalsRes] = await Promise.all([
      fetch(`/api/sprints/${sprint.id}/board`),
      fetch(`/api/sprints/${sprint.id}/totals`),
    ]);
    setItems(boardRes.ok ? await boardRes.json() : []);
    setTotals(totalsRes.ok ? await totalsRes.json() : null);
  }

  function itemsFor(status: BacklogItemStatus) {
    return items.filter((item) => item.backlog_item?.status === status);
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (closed) return;
    const activeId = String(event.active.id);
    if (!event.over) return;

    const overData = event.over.data.current;
    const targetStatus = overData?.status as BacklogItemStatus | undefined;
    const overItemId = overData?.itemId as string | undefined;
    if (!targetStatus) return;

    const activeItem = items.find((item) => item.backlog_item_id === activeId);
    if (!activeItem?.backlog_item) return;

    const previousStatus = activeItem.backlog_item.status;
    if (targetStatus === "done" && previousStatus !== "done") {
      setPendingDone({ itemId: activeId, targetStatus, overItemId: overItemId ?? null });
      return;
    }

    await applyMove(activeId, targetStatus, overItemId ?? null);
  }

  async function applyMove(
    itemId: string,
    targetStatus: BacklogItemStatus,
    overItemId: string | null,
    completedAt?: string
  ) {
    const moving = items.find((item) => item.backlog_item_id === itemId);
    if (!moving?.backlog_item) return;

    const withoutMoving = items.filter((item) => item.backlog_item_id !== itemId);
    const targetColumn = withoutMoving.filter((item) => item.backlog_item?.status === targetStatus);
    const insertIndex = overItemId
      ? Math.max(0, targetColumn.findIndex((item) => item.backlog_item_id === overItemId))
      : targetColumn.length;

    const moved: SprintItem = {
      ...moving,
      backlog_item: {
        ...moving.backlog_item,
        status: targetStatus,
        completed_at:
          targetStatus === "done"
            ? completedAt ?? moving.backlog_item.completed_at
            : null,
      },
    };

    const nextByStatus = new Map<BacklogItemStatus, SprintItem[]>();
    for (const column of columns) {
      nextByStatus.set(
        column.status,
        withoutMoving.filter((item) => item.backlog_item?.status === column.status)
      );
    }
    const nextTargetColumn = nextByStatus.get(targetStatus) ?? [];
    nextTargetColumn.splice(insertIndex < 0 ? nextTargetColumn.length : insertIndex, 0, moved);
    nextByStatus.set(targetStatus, nextTargetColumn);

    const nextItems = columns.flatMap((column) => nextByStatus.get(column.status) ?? []);
    setItems(nextItems);

    const updates = columns.flatMap((column) =>
      (nextByStatus.get(column.status) ?? []).map((item, index) => ({
        backlog_item_id: item.backlog_item_id,
        status: column.status,
        board_order: index,
        completed_at: item.backlog_item?.completed_at ?? null,
      }))
    );

    const res = await fetch(`/api/sprints/${sprint.id}/board`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: updates }),
    });

    if (!res.ok) {
      await refreshBoard();
    }
  }

  return (
    <section className="mt-6">
      <SprintClosePanel
        sprint={sprint}
        items={items}
        totals={totals}
        onClosed={(updated) => {
          onSprintChanged(updated);
          refreshBoard();
        }}
      />

      <h2 className="mb-3 text-lg font-semibold text-gray-900">Board do sprint</h2>
      {closed && (
        <p className="mb-3 rounded-md bg-gray-100 px-3 py-2 text-xs text-gray-600">
          Sprint fechado. Board em modo somente leitura.
        </p>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {columns.map((column) => (
            <BoardColumn
              key={column.status}
              title={column.title}
              status={column.status}
              items={itemsFor(column.status)}
              disabled={closed}
            />
          ))}
        </div>
      </DndContext>

      {pendingDone && (
        <CompletionDateDialog
          itemTitle={
            items.find((item) => item.backlog_item_id === pendingDone.itemId)?.backlog_item
              ?.title ?? "Item"
          }
          onCancel={() => setPendingDone(null)}
          onConfirm={async (date) => {
            await applyMove(
              pendingDone.itemId,
              pendingDone.targetStatus,
              pendingDone.overItemId,
              date
            );
            setPendingDone(null);
          }}
        />
      )}
    </section>
  );
}

function BoardColumn({
  title,
  status,
  items,
  disabled,
}: {
  title: string;
  status: BacklogItemStatus;
  items: SprintItem[];
  disabled: boolean;
}) {
  const droppable = useDroppable({ id: `column-${status}`, data: { status } });

  return (
    <div
      ref={droppable.setNodeRef}
      className={`min-h-64 rounded-lg border bg-white shadow-sm ${
        droppable.isOver ? "border-blue-400" : "border-gray-200"
      }`}
    >
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-xs text-gray-500">{items.length} item(ns)</p>
      </div>
      <div className="space-y-2 p-3">
        {items.length === 0 ? (
          <p className="rounded-md bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
            Solte itens aqui.
          </p>
        ) : (
          items.map((item) => (
            <BoardCard
              key={item.backlog_item_id}
              item={item}
              status={status}
              disabled={disabled}
            />
          ))
        )}
      </div>
    </div>
  );
}

function BoardCard({
  item,
  status,
  disabled,
}: {
  item: SprintItem;
  status: BacklogItemStatus;
  disabled: boolean;
}) {
  const draggable = useDraggable({
    id: item.backlog_item_id,
    disabled,
    data: { item },
  });
  const droppable = useDroppable({
    id: `item-${item.backlog_item_id}`,
    data: { status, itemId: item.backlog_item_id },
  });
  const setRef = (node: HTMLElement | null) => {
    draggable.setNodeRef(node);
    droppable.setNodeRef(node);
  };
  const style = draggable.transform
    ? {
        transform: `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)`,
      }
    : undefined;
  const backlogItem = item.backlog_item;

  return (
    <article
      ref={setRef}
      style={style}
      {...draggable.attributes}
      {...draggable.listeners}
      className={`rounded-md border border-gray-200 bg-white p-3 shadow-sm ${
        disabled ? "" : "cursor-grab active:cursor-grabbing"
      }`}
    >
      <p className="text-sm font-medium text-gray-900">
        {backlogItem?.title ?? item.backlog_item_id}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        {formatEstimate(backlogItem?.story_points ?? null, backlogItem?.estimate_days ?? null)}
      </p>
      {backlogItem?.completed_at && (
        <p className="mt-2 text-xs text-green-700">Concluido em {backlogItem.completed_at}</p>
      )}
    </article>
  );
}

function formatEstimate(storyPoints: number | null, estimateDays: number | null): string {
  if (!storyPoints && !estimateDays) return "Sem estimativa";
  const parts: string[] = [];
  if (storyPoints) parts.push(`${storyPoints} pts`);
  if (estimateDays) parts.push(`${estimateDays} dias`);
  return parts.join(" / ");
}

export default SprintBoard;
