import type { Release } from "../domain/types";

interface ReleaseListProps {
  releases: Release[];
  onOpen: (release: Release) => void;
  onEdit: (release: Release) => void;
  onDelete: (id: string) => void;
}

const statusLabels: Record<Release["status"], string> = {
  planned: "Planejada",
  active: "Ativa",
  closed: "Fechada",
};

const statusColors: Record<Release["status"], string> = {
  planned: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  closed: "bg-blue-100 text-blue-700",
};

export default function ReleaseList({
  releases,
  onOpen,
  onEdit,
  onDelete,
}: ReleaseListProps) {
  function handleDelete(release: Release) {
    if (
      window.confirm(
        "Excluir esta release remove o agrupamento de planejamento. Sprints e features afetados devem ser revisados antes de continuar."
      )
    ) {
      onDelete(release.id);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Release</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Periodo</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Acoes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {releases.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                Nenhuma release cadastrada ainda.
              </td>
            </tr>
          ) : (
            releases.map((release) => (
              <tr key={release.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{release.name}</p>
                  {release.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-gray-500">{release.description}</p>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {release.start_date} a {release.end_date}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[release.status]}`}>
                    {statusLabels[release.status]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <button onClick={() => onOpen(release)} className="mr-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                    Abrir release
                  </button>
                  <button onClick={() => onEdit(release)} className="mr-2 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(release)} className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100">
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
