import { Badge } from "@/components/ui/badge";
import { DEFAULT_SETTINGS } from "@/lib/settings";

type Member = {
  id: string;
  name: string;
  roleType: "FULL_TIME" | "INTERN";
  active: boolean;
};

export function MemberList({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return <p className="text-sm text-slate-500">No squad members configured yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Schedule</th>
            <th className="px-3 py-2">Hours/day</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white">
          {members.map((member) => (
            <tr key={member.id}>
              <td className="px-3 py-3 font-medium">{member.name}</td>
              <td className="px-3 py-3">{member.roleType === "FULL_TIME" ? "Full time" : "Intern"}</td>
              <td className="px-3 py-3">
                {member.roleType === "FULL_TIME" ? DEFAULT_SETTINGS.workingHoursFullTime : DEFAULT_SETTINGS.workingHoursIntern}h
              </td>
              <td className="px-3 py-3">
                <Badge tone={member.active ? "success" : "neutral"}>{member.active ? "Active" : "Inactive"}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
