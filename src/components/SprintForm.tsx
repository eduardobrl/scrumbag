import { useEffect, useState, type FormEvent } from "react";
import type { NewSprint, Sprint } from "../domain/types";

interface SprintFormProps {
  onSubmit: (sprint: NewSprint) => void | Promise<void>;
  initialSprint?: Sprint | null;
  onCancel?: () => void;
}

export default function SprintForm({
  onSubmit,
  initialSprint,
  onCancel,
}: SprintFormProps) {
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<NewSprint["status"]>("planned");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialSprint) {
      setGoal(initialSprint.goal);
      setStartDate(initialSprint.start_date);
      setEndDate(initialSprint.end_date);
      setStatus(initialSprint.status);
    } else {
      resetForm();
    }
  }, [initialSprint]);

  function resetForm() {
    setGoal("");
    setStartDate("");
    setEndDate("");
    setStatus("planned");
    setError("");
  }

  function handleCancel() {
    resetForm();
    onCancel?.();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!goal.trim() || !startDate || !endDate) {
      setError("Objetivo, inicio e fim sao obrigatorios.");
      return;
    }

    if (endDate < startDate) {
      setError("A data final deve ser igual ou posterior ao inicio.");
      return;
    }

    setError("");
    await onSubmit({
      goal: goal.trim(),
      start_date: startDate,
      end_date: endDate,
      status,
    });

    if (!initialSprint) {
      resetForm();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {initialSprint ? "Editar Sprint" : "Novo Sprint"}
      </h2>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Objetivo
        </label>
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Objetivo do sprint..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Inicio
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Fim
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as NewSprint["status"])}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="planned">Planejado</option>
            <option value="active">Ativo</option>
            <option value="closed">Fechado</option>
          </select>
        </div>
      </div>

      {error && <p className="mb-4 text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {initialSprint ? "Salvar Alteracoes" : "Criar Sprint"}
        </button>
        {(initialSprint || onCancel) && (
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
