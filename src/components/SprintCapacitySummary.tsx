import { useEffect, useState } from "react";
import type { CapacityResult, Sprint, SprintPlanningTotals } from "../domain/types";

interface SprintCapacitySummaryProps {
  sprint: Sprint;
  totals: SprintPlanningTotals | null;
  refreshKey: number;
}

export function SprintCapacitySummary({
  sprint,
  totals,
  refreshKey,
}: SprintCapacitySummaryProps) {
  const [capacity, setCapacity] = useState<CapacityResult | null>(null);
  const [capacityUnavailable, setCapacityUnavailable] = useState(false);

  useEffect(() => {
    setCapacityUnavailable(false);
    fetch(`/api/capacity?start_date=${sprint.start_date}&end_date=${sprint.end_date}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || typeof data !== "object") {
          setCapacity(null);
          setCapacityUnavailable(true);
          return;
        }
        setCapacity(data);
      })
      .catch(() => {
        setCapacity(null);
        setCapacityUnavailable(true);
      });
  }, [sprint.start_date, sprint.end_date, refreshKey]);

  const availableHours = capacity?.total_final_hours ?? capacity?.total_real_hours ?? null;
  const availableDays = availableHours === null ? null : availableHours / 6;
  const estimatedDays = totals?.total_estimate_days ?? 0;
  const overCapacity = availableDays !== null && estimatedDays > availableDays;
  const unestimatedCount = totals?.unestimated_count ?? 0;

  return (
    <section className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Metric label="Story points" value={`${totals?.total_story_points ?? 0}`} />
        <Metric label="Dias estimados" value={`${estimatedDays}`} />
        <Metric
          label="Capacidade"
          value={availableDays === null ? "--" : `${availableDays.toFixed(1)} dias`}
        />
        <Metric label="Sem estimativa" value={`${unestimatedCount}`} />
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Capacidade em dias usa 1 dia = 6h de squad para comparar com estimativas.
      </p>

      {capacityUnavailable && (
        <p className="mt-3 rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          Capacidade indisponivel agora. Os totais de pontos e dias continuam visiveis.
        </p>
      )}

      {overCapacity && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          Estimativa acima da capacidade disponivel. O aviso nao bloqueia o planejamento.
        </p>
      )}

      {unestimatedCount > 0 && (
        <p className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
          {unestimatedCount} item(ns) sem estimativa nao entram nos totais.
        </p>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default SprintCapacitySummary;
