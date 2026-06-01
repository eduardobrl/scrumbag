import { useEffect, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { Sprint, SprintPlanningTotals } from "../domain/types";
import SprintBacklogPicker from "./SprintBacklogPicker";
import SprintCapacitySummary from "./SprintCapacitySummary";
import SprintScopePanel from "./SprintScopePanel";

interface SprintPlanningWorkspaceProps {
  sprint: Sprint;
}

export function SprintPlanningWorkspace({ sprint }: SprintPlanningWorkspaceProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [totals, setTotals] = useState<SprintPlanningTotals | null>(null);
  const [dropError, setDropError] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetch(`/api/sprints/${sprint.id}/totals`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTotals(data))
      .catch(() => setTotals(null));
  }, [sprint.id, refreshKey]);

  function handleChanged() {
    setRefreshKey((key) => key + 1);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const candidate = event.active.data.current?.candidate;
    if (!candidate || event.over?.id !== "sprint-scope-drop") return;

    if (candidate.type !== "story" && candidate.type !== "bug") {
      setDropError("Apenas historias e bugs podem entrar no sprint.");
      return;
    }

    const res = await fetch(`/api/sprints/${sprint.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backlog_item_id: candidate.id }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setDropError(body?.error ?? "Nao foi possivel adicionar o item.");
      return;
    }

    setDropError("");
    handleChanged();
  }

  return (
    <div className="mt-6">
      <SprintCapacitySummary sprint={sprint} totals={totals} refreshKey={refreshKey} />

      {dropError && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {dropError}
        </p>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SprintBacklogPicker
            sprint={sprint}
            refreshKey={refreshKey}
            onChanged={handleChanged}
          />
          <SprintScopePanel
            sprint={sprint}
            refreshKey={refreshKey}
            onChanged={handleChanged}
          />
        </div>
      </DndContext>
    </div>
  );
}

export default SprintPlanningWorkspace;
