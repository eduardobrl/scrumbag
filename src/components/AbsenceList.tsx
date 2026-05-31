import type { Absence, AbsenceType, SquadMember } from "../domain/types";

interface AbsenceListProps {
  absences: Absence[];
  members: SquadMember[];
  onEdit: (absence: Absence) => void;
  onDelete: (id: string) => void;
}

const typeLabels: Record<AbsenceType, string> = {
  vacation: "Férias",
  sick_leave: "Licença Médica",
  unpaid_leave: "Licença Não Paga",
  holiday: "Feriado",
  other: "Outro",
};

export default function AbsenceList({
  absences,
  members,
  onEdit,
  onDelete,
}: AbsenceListProps) {
  const memberNames = new Map(members.map((member) => [member.id, member.name]));

  function handleDelete(id: string) {
    if (window.confirm("Tem certeza que deseja excluir esta ausência?")) {
      onDelete(id);
    }
  }

  function getMemberName(absence: Absence) {
    if (!absence.member_id) {
      return "Toda a Squad";
    }

    return memberNames.get(absence.member_id) ?? "Membro removido";
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Membro
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Início
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Fim
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Descrição
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {absences.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                Nenhuma ausência cadastrada ainda.
              </td>
            </tr>
          ) : (
            absences.map((absence) => (
              <tr key={absence.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {getMemberName(absence)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {typeLabels[absence.type] ?? absence.type}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {absence.start_date}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {absence.end_date}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {absence.description || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <button
                    onClick={() => onEdit(absence)}
                    className="mr-2 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(absence.id)}
                    className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
