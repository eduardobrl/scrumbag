import { useEffect, useState, FormEvent } from "react";
import type { Absence, AbsenceType, NewAbsence, SquadMember } from "../domain/types";

interface AbsenceFormProps {
  members: SquadMember[];
  onSubmit: (absence: NewAbsence) => void | Promise<void>;
  initialAbsence?: Absence | null;
  onCancel?: () => void;
}

const absenceTypes: { value: AbsenceType; label: string }[] = [
  { value: "vacation", label: "Férias" },
  { value: "sick_leave", label: "Licença Médica" },
  { value: "unpaid_leave", label: "Licença Não Paga" },
  { value: "holiday", label: "Feriado" },
  { value: "other", label: "Outro" },
];

export default function AbsenceForm({
  members,
  onSubmit,
  initialAbsence,
  onCancel,
}: AbsenceFormProps) {
  const [memberId, setMemberId] = useState("");
  const [type, setType] = useState<AbsenceType>("vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialAbsence) {
      setMemberId(initialAbsence.member_id ?? "");
      setType(initialAbsence.type);
      setStartDate(initialAbsence.start_date);
      setEndDate(initialAbsence.end_date);
      setDescription(initialAbsence.description ?? "");
    } else {
      resetForm();
    }
  }, [initialAbsence]);

  function resetForm() {
    setMemberId("");
    setType("vacation");
    setStartDate("");
    setEndDate("");
    setDescription("");
    setError("");
  }

  function handleCancel() {
    resetForm();
    onCancel?.();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!startDate || !endDate) {
      setError("Início e fim são obrigatórios.");
      return;
    }

    if (startDate > endDate) {
      setError("A data final deve ser maior ou igual à data inicial.");
      return;
    }

    setError("");
    await onSubmit({
      member_id: memberId || null,
      type,
      start_date: startDate,
      end_date: endDate,
      description: description.trim() || undefined,
    });

    if (!initialAbsence) {
      resetForm();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {initialAbsence ? "Editar Ausência" : "Nova Ausência"}
      </h2>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Membro
          </label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Toda a Squad (feriado)</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tipo
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AbsenceType)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            {absenceTypes.map((absenceType) => (
              <option key={absenceType.value} value={absenceType.value}>
                {absenceType.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Início
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Fim
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Descrição
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Observação opcional..."
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {error && <p className="mb-4 text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {initialAbsence ? "Salvar Alterações" : "Criar Ausência"}
        </button>
        {(initialAbsence || onCancel) && (
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
