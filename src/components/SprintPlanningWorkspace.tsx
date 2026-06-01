import { useEffect, useState } from "react";
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

  useEffect(() => {
    fetch(`/api/sprints/${sprint.id}/totals`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTotals(data))
      .catch(() => setTotals(null));
  }, [sprint.id, refreshKey]);

  function handleChanged() {
    setRefreshKey((key) => key + 1);
  }

  return (
    <div className="mt-6">
      <SprintCapacitySummary sprint={sprint} totals={totals} refreshKey={refreshKey} />

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
    </div>
  );
}

export default SprintPlanningWorkspace;
