import { useState, useEffect } from "react";
import type { BacklogItem, NewBacklogItem } from "./domain/types";
import BacklogForm from "./components/BacklogForm";
import BacklogList from "./components/BacklogList";

export default function App() {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [editingItem, setEditingItem] = useState<BacklogItem | null>(null);
  const [loading, setLoading] = useState(false);

  async function refreshItems() {
    const res = await fetch("/api/backlog");
    const data = await res.json();
    setItems(data);
  }

  useEffect(() => {
    refreshItems();
  }, []);

  async function handleCreate(item: NewBacklogItem) {
    setLoading(true);
    await fetch("/api/backlog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    await refreshItems();
    setLoading(false);
  }

  async function handleUpdate(item: NewBacklogItem) {
    if (!editingItem) return;
    setLoading(true);
    await fetch(`/api/backlog/${editingItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    setEditingItem(null);
    await refreshItems();
    setLoading(false);
  }

  async function handleDelete(id: string) {
    setLoading(true);
    await fetch(`/api/backlog/${id}`, {
      method: "DELETE",
    });
    if (editingItem?.id === id) {
      setEditingItem(null);
    }
    await refreshItems();
    setLoading(false);
  }

  function handleEdit(item: BacklogItem) {
    setEditingItem(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingItem(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Scrumbag</h1>

        <BacklogForm
          onSubmit={editingItem ? handleUpdate : handleCreate}
          initialItem={editingItem}
          onCancel={editingItem ? handleCancelEdit : undefined}
        />

        {loading && (
          <p className="mb-4 text-sm text-gray-500">Atualizando...</p>
        )}

        <BacklogList
          items={items}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
