import type { ReleaseBoardSummary } from "../domain/types";

export default function ReleaseCapacitySummary({
  summary,
}: {
  summary: ReleaseBoardSummary | null;
}) {
  const estimated = summary?.total_estimate_days ?? 0;
  const available = summary?.total_available_days;
  const over = available !== null && available !== undefined && estimated > available;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Metric label="Features" value={`${summary?.features.length ?? 0}`} />
        <Metric label="Dias estimados" value={`${estimated.toFixed(1)}`} />
        <Metric
          label="Capacidade"
          value={available === null || available === undefined ? "--" : `${available.toFixed(1)} dias`}
        />
      </div>
      {over && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Escopo acima da capacidade da release. Ajuste intervalos ou divida trabalho.
        </p>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
