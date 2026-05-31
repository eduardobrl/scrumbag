import { useState, useEffect } from "react";
import type { BacklogItem, NewBacklogItem } from "./domain/types";
import BacklogForm from "./components/BacklogForm";
import BacklogList from "./components/BacklogList";
import SyncConfig from "./components/SyncConfig";

type Tab = "backlog" | "sync";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("backlog");
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [editingItem, setEditingItem] = useState<BacklogItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function refreshItems() {
    const res = await fetch("/api/backlog?root=true");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
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
    setRefreshKey((k) => k + 1);
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
    setRefreshKey((k) => k + 1);
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
    setRefreshKey((k) => k + 1);
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

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab("backlog")}
              className={`pb-2 text-sm font-medium ${
                activeTab === "backlog"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Backlog
            </button>
            <button
              onClick={() => setActiveTab("sync")}
              className={`pb-2 text-sm font-medium ${
                activeTab === "sync"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sincronização
            </button>
          </nav>
        </div>

        {activeTab === "backlog" && (
          <>
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
              refreshKey={refreshKey}
            />
          </>
        )}

        {activeTab === "sync" && <SyncConfig />}
      </div>
    </div>
  );
}
