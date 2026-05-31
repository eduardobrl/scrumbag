import { useState, useEffect } from "react";
import type {
  Absence,
  BacklogItem,
  NewAbsence,
  NewBacklogItem,
  NewSquadMember,
  SquadMember,
} from "./domain/types";
import BacklogForm from "./components/BacklogForm";
import BacklogList from "./components/BacklogList";
import SyncConfig from "./components/SyncConfig";
import SquadMemberForm from "./components/SquadMemberForm";
import SquadMemberList from "./components/SquadMemberList";
import AbsenceForm from "./components/AbsenceForm";
import AbsenceList from "./components/AbsenceList";
import CapacityView from "./components/CapacityView";

type Tab = "backlog" | "squad" | "absences" | "capacity" | "sync";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("backlog");
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [editingItem, setEditingItem] = useState<BacklogItem | null>(null);
  const [squadMembers, setSquadMembers] = useState<SquadMember[]>([]);
  const [editingMember, setEditingMember] = useState<SquadMember | null>(null);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function refreshItems() {
    const res = await fetch("/api/backlog?root=true");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  }

  async function refreshSquadMembers() {
    const res = await fetch("/api/squad");
    const data = await res.json();
    setSquadMembers(Array.isArray(data) ? data : []);
  }

  async function refreshAbsences() {
    const res = await fetch("/api/absences");
    const data = await res.json();
    setAbsences(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    refreshItems();
  }, []);

  useEffect(() => {
    if (activeTab === "squad") {
      refreshSquadMembers();
    }

    if (activeTab === "absences") {
      refreshSquadMembers();
      refreshAbsences();
    }
  }, [activeTab]);

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

  async function handleCreateMember(member: NewSquadMember) {
    setLoading(true);
    await fetch("/api/squad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    });
    await refreshSquadMembers();
    setLoading(false);
  }

  async function handleUpdateMember(member: NewSquadMember) {
    if (!editingMember) return;
    setLoading(true);
    await fetch(`/api/squad/${editingMember.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    });
    setEditingMember(null);
    await refreshSquadMembers();
    setLoading(false);
  }

  async function handleDeleteMember(id: string) {
    setLoading(true);
    await fetch(`/api/squad/${id}`, {
      method: "DELETE",
    });
    if (editingMember?.id === id) {
      setEditingMember(null);
    }
    await refreshSquadMembers();
    setLoading(false);
  }

  function handleEditMember(member: SquadMember) {
    setEditingMember(member);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelMemberEdit() {
    setEditingMember(null);
  }

  async function handleCreateAbsence(absence: NewAbsence) {
    setLoading(true);
    await fetch("/api/absences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(absence),
    });
    await refreshAbsences();
    setLoading(false);
  }

  async function handleUpdateAbsence(absence: NewAbsence) {
    if (!editingAbsence) return;
    setLoading(true);
    await fetch(`/api/absences/${editingAbsence.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(absence),
    });
    setEditingAbsence(null);
    await refreshAbsences();
    setLoading(false);
  }

  async function handleDeleteAbsence(id: string) {
    setLoading(true);
    await fetch(`/api/absences/${id}`, {
      method: "DELETE",
    });
    if (editingAbsence?.id === id) {
      setEditingAbsence(null);
    }
    await refreshAbsences();
    setLoading(false);
  }

  function handleEditAbsence(absence: Absence) {
    setEditingAbsence(absence);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelAbsenceEdit() {
    setEditingAbsence(null);
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
              onClick={() => setActiveTab("squad")}
              className={`pb-2 text-sm font-medium ${
                activeTab === "squad"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Squad
            </button>
            <button
              onClick={() => setActiveTab("absences")}
              className={`pb-2 text-sm font-medium ${
                activeTab === "absences"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Ausências
            </button>
            <button
              onClick={() => setActiveTab("capacity")}
              className={`pb-2 text-sm font-medium ${
                activeTab === "capacity"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Capacidade
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

        {activeTab === "squad" && (
          <>
            <SquadMemberForm
              onSubmit={editingMember ? handleUpdateMember : handleCreateMember}
              initialMember={editingMember}
              onCancel={editingMember ? handleCancelMemberEdit : undefined}
            />

            {loading && (
              <p className="mb-4 text-sm text-gray-500">Atualizando...</p>
            )}

            <SquadMemberList
              members={squadMembers}
              onEdit={handleEditMember}
              onDelete={handleDeleteMember}
            />
          </>
        )}

        {activeTab === "absences" && (
          <>
            <AbsenceForm
              members={squadMembers}
              onSubmit={editingAbsence ? handleUpdateAbsence : handleCreateAbsence}
              initialAbsence={editingAbsence}
              onCancel={editingAbsence ? handleCancelAbsenceEdit : undefined}
            />

            {loading && (
              <p className="mb-4 text-sm text-gray-500">Atualizando...</p>
            )}

            <AbsenceList
              absences={absences}
              members={squadMembers}
              onEdit={handleEditAbsence}
              onDelete={handleDeleteAbsence}
            />
          </>
        )}

        {activeTab === "capacity" && <CapacityView />}

        {activeTab === "sync" && <SyncConfig />}
      </div>
    </div>
  );
}
