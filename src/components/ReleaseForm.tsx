import { useEffect, useState, type FormEvent } from "react";
import type { NewRelease, Release } from "../domain/types";

interface ReleaseFormProps {
  onSubmit: (release: NewRelease) => void | Promise<void>;
  initialRelease?: Release | null;
  onCancel?: () => void;
}

export default function ReleaseForm({
  onSubmit,
  initialRelease,
  onCancel,
}: ReleaseFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<NewRelease["status"]>("planned");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialRelease) {
      setName(initialRelease.name);
      setDescription(initialRelease.description ?? "");
      setStartDate(initialRelease.start_date);
      setEndDate(initialRelease.end_date);
      setStatus(initialRelease.status);
    } else {
      resetForm();
    }
  }, [initialRelease]);

  function resetForm() {
    setName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setStatus("planned");
    setError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !startDate || !endDate) {
      setError("Nome, inicio e fim sao obrigatorios.");
      return;
    }
    if (endDate < startDate) {
      setError("A data final deve ser igual ou posterior ao inicio.");
      return;
    }
    setError("");
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      start_date: startDate,
      end_date: endDate,
      status,
    });
    if (!initialRelease) resetForm();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {initialRelease ? "Editar release" : "Criar release"}
      </h2>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Nome da release..."
        />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">Descricao</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Contexto opcional..."
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Fim</label>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as NewRelease["status"])}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="planned">Planejada</option>
            <option value="active">Ativa</option>
            <option value="closed">Fechada</option>
          </select>
        </div>
      </div>

      {error && <p className="mb-4 text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {initialRelease ? "Salvar release" : "Criar release"}
        </button>
        {(initialRelease || onCancel) && (
          <button type="button" onClick={onCancel} className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Manter sem alteracao
          </button>
        )}
      </div>
    </form>
  );
}
