import { FormEvent, useEffect, useState } from "react";

interface WasteConfigProps {
  onSaved?: () => void;
}

export default function WasteConfig({ onSaved }: WasteConfigProps) {
  const [wastePercentage, setWastePercentage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/config/waste");
        const data = await res.json();
        setWastePercentage(Number(data.waste_percentage ?? 15));
      } catch {
        setError("Nao foi possivel carregar o percentual de desperdicio.");
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (wastePercentage < 0 || wastePercentage > 100) {
      setError("Informe um percentual entre 0 e 100.");
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/config/waste", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waste_percentage: wastePercentage }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao salvar configuracao.");
      }

      setSaved(true);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar configuracao.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Desperdicio / overhead</h2>
          <p className="mt-1 text-sm text-gray-500">
            Reunioes, suporte, incidentes e outras atividades que reduzem a capacity planejavel.
          </p>
        </div>
        {saved && <span className="text-sm font-medium text-green-700">Salvo</span>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_120px_auto] md:items-end">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Percentual atual: {wastePercentage}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={wastePercentage}
            disabled={loading}
            onChange={(e) => setWastePercentage(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">%</label>
          <input
            type="number"
            min="0"
            max="100"
            value={wastePercentage}
            disabled={loading}
            onChange={(e) => setWastePercentage(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </form>
  );
}
