type Absence = {
  id: string;
  memberName: string;
  type: "VACATION" | "DAY_OFF";
  startDate: string;
  endDate: string;
  notes: string;
};

export function AbsenceTable({ absences }: { absences: Absence[] }) {
  if (absences.length === 0) {
    return <p className="text-sm text-slate-500">No absences registered.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Member</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Start</th>
            <th className="px-3 py-2">End</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white">
          {absences.map((absence) => (
            <tr key={absence.id}>
              <td className="px-3 py-3 font-medium">{absence.memberName}</td>
              <td className="px-3 py-3">{absence.type === "VACATION" ? "Vacation" : "Day off"}</td>
              <td className="px-3 py-3">{absence.startDate}</td>
              <td className="px-3 py-3">{absence.endDate}</td>
              <td className="px-3 py-3">{absence.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
