import type { Sprint } from "../domain/types";

interface SprintListProps {
  sprints: Sprint[];
  selectedSprintId: string | null;
  onSelect: (sprint: Sprint) => void;
  onEdit: (sprint: Sprint) => void;
  onDelete: (id: string) => void;
}

const statusLabels: Record<Sprint["status"], string> = {
  planned: "Planejado",
  active: "Ativo",
  closed: "Fechado",
};

const statusColors: Record<Sprint["status"], string> = {
  planned: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  closed: "bg-blue-100 text-blue-700",
};

export default function SprintList({
  sprints,
  selectedSprintId,
  onSelect,
  onEdit,
  onDelete,
}: SprintListProps) {
  function handleDelete(id: string) {
    if (window.confirm("Tem certeza que deseja excluir este sprint?")) {
      onDelete(id);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Objetivo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Periodo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
              Acoes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sprints.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                Nenhum sprint cadastrado ainda.
              </td>
            </tr>
          ) : (
            sprints.map((sprint) => (
              <tr
                key={sprint.id}
                className={selectedSprintId === sprint.id ? "bg-blue-50" : "hover:bg-gray-50"}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {sprint.goal}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {sprint.start_date} a {sprint.end_date}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[sprint.status]}`}
                  >
                    {statusLabels[sprint.status]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <button
                    onClick={() => onSelect(sprint)}
                    className="mr-2 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                  >
                    Selecionar
                  </button>
                  <button
                    onClick={() => onEdit(sprint)}
                    className="mr-2 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(sprint.id)}
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
