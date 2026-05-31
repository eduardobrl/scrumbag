import type { SquadMember } from "../domain/types";

interface SquadMemberListProps {
  members: SquadMember[];
  onEdit: (member: SquadMember) => void;
  onDelete: (id: string) => void;
}

export default function SquadMemberList({
  members,
  onEdit,
  onDelete,
}: SquadMemberListProps) {
  function handleDelete(id: string) {
    if (window.confirm("Tem certeza que deseja excluir este membro?")) {
      onDelete(id);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Nome
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Função
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Capacidade Diária (h)
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {members.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                Nenhum membro cadastrado ainda.
              </td>
            </tr>
          ) : (
            members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {member.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {member.role}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {member.daily_capacity_hours}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <button
                    onClick={() => onEdit(member)}
                    className="mr-2 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
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
