import { useState, useEffect, FormEvent } from "react";
import type { BacklogItem, NewBacklogItem } from "../domain/types";

interface BacklogFormProps {
  onSubmit: (item: NewBacklogItem) => void;
  initialItem?: BacklogItem | null;
  onCancel?: () => void;
}

export default function BacklogForm({
  onSubmit,
  initialItem,
  onCancel,
}: BacklogFormProps) {
  const [type, setType] = useState<NewBacklogItem["type"]>("story");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<NewBacklogItem["status"]>("backlog");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialItem) {
      setType(initialItem.type);
      setTitle(initialItem.title);
      setDescription(initialItem.description ?? "");
      setStatus(initialItem.status);
    } else {
      resetForm();
    }
  }, [initialItem]);

  function resetForm() {
    setType("story");
    setTitle("");
    setDescription("");
    setStatus("backlog");
    setError("");
  }

  function handleCancel() {
    resetForm();
    onCancel?.();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("O título é obrigatório.");
      return;
    }
    setError("");

    onSubmit({
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      status,
    });

    if (!initialItem) {
      resetForm();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {initialItem ? "Editar Item" : "Novo Item"}
      </h2>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tipo
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as NewBacklogItem["type"])}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="epic">Épico</option>
            <option value="feature">Feature</option>
            <option value="story">História</option>
            <option value="bug">Bug</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as NewBacklogItem["status"])
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="backlog">Backlog</option>
            <option value="in_progress">Em Progresso</option>
            <option value="done">Concluído</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Título
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Digite o título do item..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Descrição
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Digite uma descrição opcional..."
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {initialItem ? "Salvar Alterações" : "Criar Item"}
        </button>
        {(initialItem || onCancel) && (
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
