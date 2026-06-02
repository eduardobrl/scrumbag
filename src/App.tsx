import { useState, useEffect, type ReactNode } from "react";
import type {
  Absence,
  BacklogItem,
  NewAbsence,
  NewBacklogItem,
  NewRelease,
  NewSquadMember,
  Release,
  SquadMember,
  Sprint,
} from "./domain/types";
import FeatureFirstBacklog from "./components/FeatureFirstBacklog";
import SyncConfig from "./components/SyncConfig";
import SquadMemberForm from "./components/SquadMemberForm";
import SquadMemberList from "./components/SquadMemberList";
import AbsenceForm from "./components/AbsenceForm";
import AbsenceList from "./components/AbsenceList";
import CapacityView from "./components/CapacityView";
import SprintList from "./components/SprintList";
import ReleaseForm from "./components/ReleaseForm";
import ReleaseList from "./components/ReleaseList";
import ReleaseDetailScreen from "./components/ReleaseDetailScreen";
import SprintDetailScreen from "./components/SprintDetailScreen";

type Tab = "releases" | "backlog" | "sprints" | "squad" | "absences" | "capacity" | "sync";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("releases");
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [editingItem, setEditingItem] = useState<BacklogItem | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [selectedSprintRelease, setSelectedSprintRelease] = useState<Release | null>(null);
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

  async function refreshReleases() {
    const res = await fetch("/api/releases");
    const data = await res.json();
    setReleases(Array.isArray(data) ? data : []);
  }

  async function refreshSprints() {
    const res = await fetch("/api/sprints");
    const data = await res.json();
    setSprints(Array.isArray(data) ? data : []);
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
    refreshReleases();
  }, []);

  useEffect(() => {
    if (activeTab === "backlog") refreshItems();
    if (activeTab === "releases") refreshReleases();
    if (activeTab === "sprints") refreshSprints();
    if (activeTab === "squad") refreshSquadMembers();
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
    setRefreshKey((key) => key + 1);
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
    setRefreshKey((key) => key + 1);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    setLoading(true);
    await fetch(`/api/backlog/${id}`, { method: "DELETE" });
    if (editingItem?.id === id) setEditingItem(null);
    await refreshItems();
    setRefreshKey((key) => key + 1);
    setLoading(false);
  }

  async function handleCreateRelease(release: NewRelease) {
    setLoading(true);
    await fetch("/api/releases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(release),
    });
    await refreshReleases();
    setLoading(false);
  }

  async function handleUpdateRelease(release: NewRelease) {
    if (!editingRelease) return;
    setLoading(true);
    await fetch(`/api/releases/${editingRelease.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(release),
    });
    setEditingRelease(null);
    await refreshReleases();
    setLoading(false);
  }

  async function handleDeleteRelease(id: string) {
    setLoading(true);
    await fetch(`/api/releases/${id}`, { method: "DELETE" });
    if (selectedRelease?.id === id) setSelectedRelease(null);
    if (editingRelease?.id === id) setEditingRelease(null);
    await refreshReleases();
    setLoading(false);
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
    await fetch(`/api/squad/${id}`, { method: "DELETE" });
    if (editingMember?.id === id) setEditingMember(null);
    await refreshSquadMembers();
    setLoading(false);
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
    await fetch(`/api/absences/${id}`, { method: "DELETE" });
    if (editingAbsence?.id === id) setEditingAbsence(null);
    await refreshAbsences();
    setLoading(false);
  }

  function openSprint(sprint: Sprint, release?: Release | null) {
    setSelectedSprint(sprint);
    setSelectedSprintRelease(release ?? null);
  }

  function closeSprintDetail() {
    setSelectedSprint(null);
    setSelectedSprintRelease(null);
  }

  if (selectedSprint) {
    return (
      <Shell activeTab={activeTab} setActiveTab={setActiveTab}>
        <SprintDetailScreen
          sprint={selectedSprint}
          release={selectedSprintRelease}
          onBack={closeSprintDetail}
          onSprintChanged={setSelectedSprint}
        />
      </Shell>
    );
  }

  if (selectedRelease) {
    return (
      <Shell activeTab={activeTab} setActiveTab={setActiveTab}>
        <ReleaseDetailScreen
          release={selectedRelease}
          onBack={() => {
            setSelectedRelease(null);
            refreshReleases();
          }}
          onOpenSprint={openSprint}
          onCreateFeature={() => {
            setSelectedRelease(null);
            setActiveTab("backlog");
          }}
        />
      </Shell>
    );
  }

  return (
    <Shell activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "releases" && (
        <>
          <ReleaseForm
            onSubmit={editingRelease ? handleUpdateRelease : handleCreateRelease}
            initialRelease={editingRelease}
            onCancel={editingRelease ? () => setEditingRelease(null) : undefined}
          />

          {loading && <p className="mb-4 text-sm text-gray-500">Atualizando...</p>}

          <ReleaseList
            releases={releases}
            onOpen={setSelectedRelease}
            onEdit={(release) => setEditingRelease(release)}
            onDelete={handleDeleteRelease}
          />
        </>
      )}

      {activeTab === "backlog" && (
        <>
          {loading && <p className="mb-4 text-sm text-gray-500">Atualizando...</p>}
          <FeatureFirstBacklog
            items={items}
            editingItem={editingItem}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onEdit={(item) => setEditingItem(item)}
            onDelete={handleDelete}
            onCancelEdit={() => setEditingItem(null)}
            refreshKey={refreshKey}
          />
        </>
      )}

      {activeTab === "sprints" && (
        <>
          <p className="mb-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Sprints sao criados dentro de uma release. Use esta lista apenas para abrir sprints existentes.
          </p>
          <SprintList
            sprints={sprints}
            selectedSprintId={null}
            onSelect={(sprint) => openSprint(sprint)}
            onEdit={() => undefined}
            onDelete={() => undefined}
          />
        </>
      )}

      {activeTab === "squad" && (
        <>
          <SquadMemberForm
            onSubmit={editingMember ? handleUpdateMember : handleCreateMember}
            initialMember={editingMember}
            onCancel={editingMember ? () => setEditingMember(null) : undefined}
          />
          {loading && <p className="mb-4 text-sm text-gray-500">Atualizando...</p>}
          <SquadMemberList
            members={squadMembers}
            onEdit={(member) => setEditingMember(member)}
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
            onCancel={editingAbsence ? () => setEditingAbsence(null) : undefined}
          />
          {loading && <p className="mb-4 text-sm text-gray-500">Atualizando...</p>}
          <AbsenceList
            absences={absences}
            members={squadMembers}
            onEdit={(absence) => setEditingAbsence(absence)}
            onDelete={handleDeleteAbsence}
          />
        </>
      )}

      {activeTab === "capacity" && <CapacityView />}

      {activeTab === "sync" && <SyncConfig />}
    </Shell>
  );
}

function Shell({
  activeTab,
  setActiveTab,
  children,
}: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  children: ReactNode;
}) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "releases", label: "Releases" },
    { id: "backlog", label: "Backlog" },
    { id: "sprints", label: "Sprints" },
    { id: "squad", label: "Squad" },
    { id: "absences", label: "Ausencias" },
    { id: "capacity", label: "Capacidade" },
    { id: "sync", label: "Sincronizacao" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Scrumbag</h1>

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {children}
      </div>
    </div>
  );
}
