import { useEffect, useState, FormEvent } from "react";
import type { NewSquadMember, SquadMember } from "../domain/types";

interface SquadMemberFormProps {
  onSubmit: (member: NewSquadMember) => void | Promise<void>;
  initialMember?: SquadMember | null;
  onCancel?: () => void;
}

export default function SquadMemberForm({
  onSubmit,
  initialMember,
  onCancel,
}: SquadMemberFormProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [dailyCapacityHours, setDailyCapacityHours] = useState(6);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialMember) {
      setName(initialMember.name);
      setRole(initialMember.role);
      setDailyCapacityHours(initialMember.daily_capacity_hours);
    } else {
      resetForm();
    }
  }, [initialMember]);

  function resetForm() {
    setName("");
    setRole("");
    setDailyCapacityHours(6);
    setError("");
  }

  function handleCancel() {
    resetForm();
    onCancel?.();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!name.trim() || !role.trim()) {
      setError("Nome e função são obrigatórios.");
      return;
    }

    setError("");
    await onSubmit({
      name: name.trim(),
      role: role.trim(),
      daily_capacity_hours: dailyCapacityHours,
    });

    if (!initialMember) {
      resetForm();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {initialMember ? "Editar Membro" : "Novo Membro"}
      </h2>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="João Silva"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Função
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Dev, QA, Tech Lead..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Capacidade Diária (h)
          </label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={dailyCapacityHours}
            onChange={(e) => setDailyCapacityHours(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="mb-4 text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {initialMember ? "Salvar Alterações" : "Criar Membro"}
        </button>
        {(initialMember || onCancel) && (
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
