import { useState, useEffect, FormEvent } from "react";
import { FIBONACCI_POINTS } from "../domain/types";
import type { BacklogItem, NewBacklogItem, StoryPoint } from "../domain/types";

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
  const [parentId, setParentId] = useState<string | null>(null);
  const [storyPoints, setStoryPoints] = useState("");
  const [estimateDays, setEstimateDays] = useState("");
  const [rootItems, setRootItems] = useState<BacklogItem[]>([]);
  const [error, setError] = useState("");
  const [descendantIds, setDescendantIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialItem) {
      setType(initialItem.type);
      setTitle(initialItem.title);
      setDescription(initialItem.description ?? "");
      setStatus(initialItem.status);
      setParentId(initialItem.parent_id);
      setStoryPoints(initialItem.story_points?.toString() ?? "");
      setEstimateDays(initialItem.estimate_days?.toString() ?? "");
    } else {
      resetForm();
    }
  }, [initialItem]);

  useEffect(() => {
    fetch("/api/backlog?root=true")
      .then((res) => res.json())
      .then((data) => setRootItems(Array.isArray(data) ? data : []))
      .catch(() => setRootItems([]));
  }, []);

  useEffect(() => {
    if (!initialItem) {
      setDescendantIds(new Set());
      return;
    }
    const exclude = new Set<string>();
    exclude.add(initialItem.id);

    async function collectChildren(parentId: string) {
      const res = await fetch(`/api/backlog?parent_id=${parentId}`);
      const children: BacklogItem[] = await res.json();
      for (const child of children) {
        if (!exclude.has(child.id)) {
          exclude.add(child.id);
          await collectChildren(child.id);
        }
      }
    }

    collectChildren(initialItem.id).then(() => {
      setDescendantIds(exclude);
    }).catch(() => {
      setDescendantIds(new Set([initialItem.id]));
    });
  }, [initialItem]);

  function resetForm() {
    setType("story");
    setTitle("");
    setDescription("");
    setStatus("backlog");
    setParentId(null);
    setStoryPoints("");
    setEstimateDays("");
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

    const executable = type === "story" || type === "bug";
    const parsedStoryPoints = storyPoints ? (Number(storyPoints) as StoryPoint) : null;
    const parsedEstimateDays = estimateDays === "" ? null : Number(estimateDays);

    onSubmit({
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      parent_id: parentId,
      story_points: executable ? parsedStoryPoints : null,
      estimate_days: executable ? parsedEstimateDays : null,
    });

    if (!initialItem) {
      resetForm();
    }
  }

  const parentOptions = rootItems.filter(
    (item) => !descendantIds.has(item.id)
  );
  const showsEstimateFields = type === "story" || type === "bug";

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {initialItem ? "Editar Item" : "Novo Item"}
      </h2>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
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

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Pai
          </label>
          <select
            value={parentId ?? ""}
            onChange={(e) =>
              setParentId(e.target.value ? e.target.value : null)
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Sem pai</option>
            {parentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.type})
              </option>
            ))}
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

      {showsEstimateFields ? (
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Story points
            </label>
            <select
              value={storyPoints}
              onChange={(e) => setStoryPoints(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Sem estimativa</option>
              {FIBONACCI_POINTS.map((point) => (
                <option key={point} value={point}>
                  {point}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Dias de trabalho
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={estimateDays}
              onChange={(e) => setEstimateDays(e.target.value)}
              placeholder="0"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      ) : (
        <p className="mb-4 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
          Epicos e features agregam estimativas das historias e bugs filhos.
        </p>
      )}

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
