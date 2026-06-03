type Holiday = {
  id: string;
  date: string;
  name: string;
};

export function HolidayTable({ holidays }: { holidays: Holiday[] }) {
  if (holidays.length === 0) {
    return <p className="text-sm text-slate-500">No holidays registered.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Name</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white">
          {holidays.map((holiday) => (
            <tr key={holiday.id}>
              <td className="px-3 py-3">{holiday.date}</td>
              <td className="px-3 py-3 font-medium">{holiday.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
