import { useEffect, useState, type FormEvent } from "react";
import { FIBONACCI_POINTS } from "../domain/types";
import type { BacklogItem, NewBacklogItem, StoryPoint } from "../domain/types";

interface BacklogFormProps {
  onSubmit: (item: NewBacklogItem) => void;
  initialItem?: BacklogItem | null;
  onCancel?: () => void;
  mode?: "feature" | "child" | "legacy";
  parentFeature?: BacklogItem | null;
}

export default function BacklogForm({
  onSubmit,
  initialItem,
  onCancel,
  mode = "legacy",
  parentFeature = null,
}: BacklogFormProps) {
  const [type, setType] = useState<NewBacklogItem["type"]>(
    mode === "feature" ? "feature" : "story"
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<NewBacklogItem["status"]>("backlog");
  const [parentId, setParentId] = useState<string | null>(
    mode === "child" ? parentFeature?.id ?? null : null
  );
  const [storyPoints, setStoryPoints] = useState("");
  const [estimateDays, setEstimateDays] = useState("");
  const [rootItems, setRootItems] = useState<BacklogItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/backlog?root=true")
      .then((res) => res.json())
      .then((data) => setRootItems(Array.isArray(data) ? data : []))
      .catch(() => setRootItems([]));
  }, []);

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
  }, [initialItem, mode, parentFeature?.id]);

  function resetForm() {
    setType(mode === "feature" ? "feature" : "story");
    setTitle("");
    setDescription("");
    setStatus("backlog");
    setParentId(mode === "child" ? parentFeature?.id ?? null : null);
    setStoryPoints("");
    setEstimateDays("");
    setError("");
  }

  function handleCancel() {
    resetForm();
    onCancel?.();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("O titulo e obrigatorio.");
      return;
    }
    const fixedParentId = mode === "child" ? parentFeature?.id ?? null : parentId;
    if ((type === "story" || type === "bug") && !fixedParentId) {
      setError("Historias e bugs precisam estar dentro de uma feature.");
      return;
    }

    const parsedStoryPoints = storyPoints ? (Number(storyPoints) as StoryPoint) : null;
    const parsedEstimateDays = estimateDays === "" ? null : Number(estimateDays);
    const executable = type === "story" || type === "bug";

    setError("");
    onSubmit({
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      parent_id: fixedParentId,
      story_points: executable ? parsedStoryPoints : null,
      estimate_days: executable ? parsedEstimateDays : null,
    });

    if (!initialItem) resetForm();
  }

  const featureMode = mode === "feature";
  const childMode = mode === "child" && parentFeature;
  const showsEstimateFields = type === "story" || type === "bug";

  return (
    <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {initialItem
          ? "Editar item"
          : featureMode
            ? "Criar feature"
            : childMode
              ? "Adicionar historia ou bug"
              : "Novo item"}
      </h2>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
          <select
            value={type}
            disabled={featureMode}
            onChange={(event) => setType(event.target.value as NewBacklogItem["type"])}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          >
            {featureMode ? (
              <option value="feature">Feature</option>
            ) : childMode ? (
              <>
                <option value="story">Historia</option>
                <option value="bug">Bug</option>
              </>
            ) : (
              <>
                <option value="epic">Epico</option>
                <option value="feature">Feature</option>
                <option value="story">Historia</option>
                <option value="bug">Bug</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as NewBacklogItem["status"])}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="backlog">Backlog</option>
            <option value="in_progress">Em progresso</option>
            <option value="done">Concluido</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Pai</label>
          <select
            value={childMode ? parentFeature.id : parentId ?? ""}
            disabled={Boolean(childMode)}
            onChange={(event) => setParentId(event.target.value ? event.target.value : null)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          >
            <option value="">Sem pai</option>
            {childMode ? (
              <option value={parentFeature.id}>{parentFeature.title} (feature)</option>
            ) : (
              rootItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.type})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">Titulo</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Digite o titulo..."
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">Descricao</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Descricao opcional..."
        />
      </div>

      {showsEstimateFields ? (
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Story points</label>
            <select
              value={storyPoints}
              onChange={(event) => setStoryPoints(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Sem estimativa</option>
              {FIBONACCI_POINTS.map((point) => (
                <option key={point} value={point}>{point}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Dias de trabalho</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={estimateDays}
              onChange={(event) => setEstimateDays(event.target.value)}
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
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {initialItem
            ? "Salvar alteracoes"
            : featureMode
              ? "Criar feature"
              : childMode
                ? "Adicionar historia ou bug"
                : "Criar item"}
        </button>
        {(initialItem || onCancel) && (
          <button type="button" onClick={handleCancel} className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Manter sem alteracao
          </button>
        )}
      </div>
    </form>
  );
}
