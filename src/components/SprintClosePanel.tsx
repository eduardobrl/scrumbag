import type { Sprint, SprintItem, SprintPlanningTotals } from "../domain/types";

interface SprintClosePanelProps {
  sprint: Sprint;
  items: SprintItem[];
  totals: SprintPlanningTotals | null;
  onClosed: (sprint: Sprint) => void;
}

export function SprintClosePanel({
  sprint,
  items,
  totals,
  onClosed,
}: SprintClosePanelProps) {
  const unfinished = items.filter((item) => item.backlog_item?.status !== "done").length;
  const unestimated = totals?.unestimated_count ?? 0;
  const closed = sprint.status === "closed";

  async function handleClose() {
    const warnings: string[] = [];
    if (unfinished > 0) warnings.push(`${unfinished} item(ns) ainda nao estao Done`);
    if (unestimated > 0) warnings.push(`${unestimated} item(ns) sem estimativa completa`);

    const message =
      warnings.length > 0
        ? `Fechar sprint mesmo assim?\n\n${warnings.join("\n")}`
        : "Fechar este sprint?";

    if (!window.confirm(message)) return;

    const res = await fetch(`/api/sprints/${sprint.id}/close`, { method: "POST" });
    if (res.ok) {
      onClosed(await res.json());
    }
  }

  return (
    <section className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Fechamento do sprint</h3>
          {closed ? (
            <p className="mt-1 text-xs text-gray-500">
              Sprint fechado em {sprint.closed_at ?? "-"}.
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              Fechar preserva escopo, status, estimativas e datas de conclusao.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleClose}
          disabled={closed}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Fechar sprint
        </button>
      </div>

      {!closed && (unfinished > 0 || unestimated > 0) && (
        <p className="mt-3 rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          {unfinished > 0 && `${unfinished} item(ns) fora de Done. `}
          {unestimated > 0 && `${unestimated} item(ns) sem estimativa.`}
        </p>
      )}
    </section>
  );
}

export default SprintClosePanel;
