import { useEffect, useState } from "react";
import type { Release, Sprint, SprintItem, SprintPlanningTotals } from "../domain/types";
import SprintBoard from "./SprintBoard";
import SprintCapacitySummary from "./SprintCapacitySummary";
import SprintClosePanel from "./SprintClosePanel";
import SprintPlanningWorkspace from "./SprintPlanningWorkspace";

type SprintTab = "board" | "planning" | "capacity" | "closure";

interface SprintDetailScreenProps {
  sprint: Sprint;
  release?: Release | null;
  onBack: () => void;
  onSprintChanged: (sprint: Sprint) => void;
}

const statusLabels: Record<Sprint["status"], string> = {
  planned: "Planejado",
  active: "Ativo",
  closed: "Fechado",
};

export default function SprintDetailScreen({
  sprint,
  release,
  onBack,
  onSprintChanged,
}: SprintDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<SprintTab>("board");
  const [items, setItems] = useState<SprintItem[]>([]);
  const [totals, setTotals] = useState<SprintPlanningTotals | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    refreshSprintData();
  }, [sprint.id, refreshKey]);

  async function refreshSprintData() {
    const [itemsRes, totalsRes] = await Promise.all([
      fetch(`/api/sprints/${sprint.id}/items`),
      fetch(`/api/sprints/${sprint.id}/totals`),
    ]);
    setItems(itemsRes.ok ? await itemsRes.json() : []);
    setTotals(totalsRes.ok ? await totalsRes.json() : null);
  }

  function handleScopeChanged() {
    setRefreshKey((key) => key + 1);
  }

  function handleSprintClosed(updated: Sprint) {
    onSprintChanged(updated);
    setRefreshKey((key) => key + 1);
  }

  const tabs: { id: SprintTab; label: string }[] = [
    { id: "board", label: "Board" },
    { id: "planning", label: "Planning" },
    { id: "capacity", label: "Capacity" },
    { id: "closure", label: "Closure" },
  ];

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-4 text-sm font-medium text-blue-600 hover:text-blue-700">
        Voltar
      </button>

      <header className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">
              {release ? release.name : "Sprint"}
            </p>
            <h1 className="mt-1 text-[28px] font-semibold leading-tight text-gray-900">{sprint.goal}</h1>
            <p className="mt-1 text-sm text-gray-500">{sprint.start_date} a {sprint.end_date}</p>
          </div>
          <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {statusLabels[sprint.status]}
          </span>
        </div>
      </header>

      <div className="mb-5 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 text-sm font-medium ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "board" && (
        <SprintBoard
          sprint={sprint}
          refreshKey={refreshKey}
          onSprintChanged={(updated) => {
            onSprintChanged(updated);
            handleScopeChanged();
          }}
        />
      )}

      {activeTab === "planning" && (
        sprint.status === "closed" ? (
          <p className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-600">
            Sprint fechado. Planejamento em modo somente leitura.
          </p>
        ) : (
          <SprintPlanningWorkspace sprint={sprint} onScopeChanged={handleScopeChanged} />
        )
      )}

      {activeTab === "capacity" && (
        <SprintCapacitySummary sprint={sprint} totals={totals} refreshKey={refreshKey} />
      )}

      {activeTab === "closure" && (
        <SprintClosePanel
          sprint={sprint}
          items={items}
          totals={totals}
          onClosed={handleSprintClosed}
        />
      )}
    </div>
  );
}
