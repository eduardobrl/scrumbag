import { useState, useEffect, useCallback } from "react";

interface SyncStatus {
  folderPath: string;
  lastSync: string | null;
  filesWatched: number;
}

export default function SyncConfig() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [newFolder, setNewFolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/sync/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function handleUpdateFolder() {
    if (!newFolder.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/sync/folder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderPath: newFolder.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
        setNewFolder("");
        setMessage("Pasta de sincronização atualizada.");
      } else {
        setMessage(data.error || "Erro ao atualizar pasta.");
      }
    } catch {
      setMessage("Erro de conexão ao atualizar pasta.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTriggerSync() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/sync/trigger", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Sincronização concluída: ${data.imported} importados, ${data.skipped} ignorados.`);
        fetchStatus();
      } else {
        setMessage(data.error || "Erro ao sincronizar.");
      }
    } catch {
      setMessage("Erro de conexão ao sincronizar.");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "Nunca";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("pt-BR");
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Configuração de Sincronização
      </h2>

      {status && (
        <div className="mb-6 space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-medium">Pasta atual:</span>{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              {status.folderPath}
            </code>
          </p>
          <p>
            <span className="font-medium">Última sincronização:</span>{" "}
            {formatDate(status.lastSync)}
          </p>
          <p>
            <span className="font-medium">Arquivos processados:</span>{" "}
            {status.filesWatched}
          </p>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newFolder}
          onChange={(e) => setNewFolder(e.target.value)}
          placeholder="Nova pasta (ex: ./synced)"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleUpdateFolder}
          disabled={loading || !newFolder.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
        >
          Atualizar
        </button>
      </div>

      <div className="mb-4">
        <button
          onClick={handleTriggerSync}
          disabled={loading}
          className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:bg-gray-400"
        >
          Sincronizar Agora
        </button>
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.includes("Erro") ? "text-red-600" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
