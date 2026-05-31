import { useState, useEffect, FormEvent } from "react";
import type { BacklogItem } from "./domain/types";

export default function App() {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [type, setType] = useState("story");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function refreshItems() {
    const res = await fetch("/api/backlog");
    const data = await res.json();
    setItems(data);
  }

  useEffect(() => {
    refreshItems();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    await fetch("/api/backlog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title }),
    });
    setTitle("");
    await refreshItems();
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Scrumbag</h1>

        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="epic">Épico</option>
              <option value="feature">Feature</option>
              <option value="story">História</option>
              <option value="bug">Bug</option>
            </select>
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
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar Item"}
          </button>
        </form>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <h2 className="border-b border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900">
            Backlog
          </h2>

          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">
              Nenhum item no backlog ainda.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {items.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {item.title}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {item.type}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
