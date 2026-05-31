import { FormEvent, useCallback, useEffect, useState } from "react";
import type { CapacityOverride, CapacityResult, SquadMember } from "../domain/types";
import WasteConfig from "./WasteConfig";

interface OverrideFormState {
  member_id: string;
  start_date: string;
  end_date: string;
  override_hours: number;
  reason: string;
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentWorkWeek() {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return {
    start: formatDateInput(monday),
    end: formatDateInput(friday),
  };
}

function hours(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function CapacityView() {
  const defaultRange = currentWorkWeek();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [result, setResult] = useState<CapacityResult | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [overrides, setOverrides] = useState<CapacityOverride[]>([]);
  const [overrideForm, setOverrideForm] = useState<OverrideFormState>({
    member_id: "",
    start_date: defaultRange.start,
    end_date: defaultRange.end,
    override_hours: 1,
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [error, setError] = useState("");
  const [overrideError, setOverrideError] = useState("");

  const fetchMembers = useCallback(async () => {
    const res = await fetch("/api/squad");
    const data = await res.json();
    const nextMembers = Array.isArray(data) ? data : [];
    setMembers(nextMembers);
    setOverrideForm((current) => ({
      ...current,
      member_id: current.member_id || nextMembers[0]?.id || "",
    }));
  }, []);

  const fetchOverrides = useCallback(async () => {
    const res = await fetch("/api/capacity-overrides");
    const data = await res.json();
    setOverrides(Array.isArray(data) ? data : []);
  }, []);

  const calculate = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });
      const res = await fetch(`/api/capacity?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Falha ao calcular capacity.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao calcular capacity.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchMembers();
    fetchOverrides();
  }, [fetchMembers, fetchOverrides]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  async function handleCalculate(e: FormEvent) {
    e.preventDefault();
    await calculate();
  }

  async function handleCreateOverride(e: FormEvent) {
    e.preventDefault();
    setOverrideLoading(true);
    setOverrideError("");

    if (!overrideForm.member_id) {
      setOverrideError("Selecione um membro para aplicar o override.");
      setOverrideLoading(false);
      return;
    }

    if (overrideForm.start_date > overrideForm.end_date) {
      setOverrideError("A data final deve ser maior ou igual a data inicial.");
      setOverrideLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/capacity-overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: overrideForm.member_id,
          start_date: overrideForm.start_date,
          end_date: overrideForm.end_date,
          override_hours: overrideForm.override_hours,
          reason: overrideForm.reason.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Falha ao criar override.");
      }

      setOverrideForm((current) => ({
        ...current,
        override_hours: 1,
        reason: "",
      }));
      await fetchOverrides();
      await calculate();
    } catch (err) {
      setOverrideError(err instanceof Error ? err.message : "Falha ao criar override.");
    } finally {
      setOverrideLoading(false);
    }
  }

  async function handleDeleteOverride(id: string) {
    if (!window.confirm("Excluir este override de capacity?")) {
      return;
    }

    await fetch(`/api/capacity-overrides/${id}`, { method: "DELETE" });
    await fetchOverrides();
    await calculate();
  }

  const memberNames = new Map(members.map((member) => [member.id, member.name]));

  return (
    <div>
      <WasteConfig onSaved={calculate} />

      <form
        onSubmit={handleCalculate}
        className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Calculo de capacity</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Fim</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            {loading ? "Calculando..." : "Calcular"}
          </button>
        </div>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </form>

      <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        Capacidade Bruta - Ausencias - Feriados - Desperdicio = Capacidade Real.
      </div>

      <div className="mb-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Membro
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Bruta (h)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Ausencias (h)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Feriados (h)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Desperdicio (h)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Real (h)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {!result || result.members.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                  Cadastre membros na aba Squad para calcular capacity.
                </td>
              </tr>
            ) : (
              <>
                {result.members.map((member) => (
                  <tr key={member.member_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{member.member_name}</div>
                      <div className="text-xs text-gray-500">
                        {member.role} - {member.daily_capacity_hours}h/dia
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {hours(member.raw_capacity_hours)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {hours(member.absence_hours)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {hours(member.holiday_hours)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {hours(member.waste_hours)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {hours(member.final_capacity_hours)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold text-gray-900">
                  <td className="px-4 py-3 text-sm">Total</td>
                  <td className="px-4 py-3 text-right text-sm">{hours(result.total_raw_hours)}</td>
                  <td className="px-4 py-3 text-right text-sm">{hours(result.total_absence_hours)}</td>
                  <td className="px-4 py-3 text-right text-sm">{hours(result.total_holiday_hours)}</td>
                  <td className="px-4 py-3 text-right text-sm">{hours(result.total_waste_hours)}</td>
                  <td className="px-4 py-3 text-right text-sm">{hours(result.total_final_hours)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={handleCreateOverride}
        className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Override de capacity</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Membro</label>
            <select
              value={overrideForm.member_id}
              onChange={(e) => setOverrideForm({ ...overrideForm, member_id: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Selecione...</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Horas no periodo</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={overrideForm.override_hours}
              onChange={(e) =>
                setOverrideForm({ ...overrideForm, override_hours: Number(e.target.value) })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Inicio</label>
            <input
              type="date"
              value={overrideForm.start_date}
              onChange={(e) => setOverrideForm({ ...overrideForm, start_date: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Fim</label>
            <input
              type="date"
              value={overrideForm.end_date}
              onChange={(e) => setOverrideForm({ ...overrideForm, end_date: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Motivo</label>
          <input
            type="text"
            value={overrideForm.reason}
            onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
            placeholder="Ex.: onboarding, meio periodo, suporte critico"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {overrideError && <p className="mt-3 text-xs text-red-600">{overrideError}</p>}

        <button
          type="submit"
          disabled={overrideLoading || members.length === 0}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
        >
          {overrideLoading ? "Salvando..." : "Criar override"}
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Membro
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Periodo
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Horas
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {overrides.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                  Nenhum override cadastrado.
                </td>
              </tr>
            ) : (
              overrides.map((override) => (
                <tr key={override.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {memberNames.get(override.member_id) ?? override.member_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {override.start_date} a {override.end_date}
                    {override.reason && <div className="text-xs text-gray-500">{override.reason}</div>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">
                    {hours(override.override_hours)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => handleDeleteOverride(override.id)}
                      className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
