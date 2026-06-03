"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Member = {
  id: string;
  name: string;
  roleType: "FULL_TIME" | "INTERN";
  active: boolean;
};

type Settings = {
  workingHoursFullTime: number;
  workingHoursIntern: number;
};

export function MemberTable({ members, settings }: { members: Member[]; settings: Settings }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Member | null>(null);
  const [isPending, startTransition] = useTransition();

  async function save(member: Member) {
    const response = await fetch(`/api/squad-members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member)
    });

    if (response.ok) {
      setEditing(null);
      startTransition(() => router.refresh());
    }
  }

  async function toggleActive(member: Member) {
    await save({ ...member, active: !member.active });
  }

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
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white">
          {members.map((member) => {
            const draft = editing?.id === member.id ? editing : member;
            return (
              <tr key={member.id}>
                <td className="px-3 py-3">
                  {editing?.id === member.id ? (
                    <Input value={draft.name} onChange={(event) => setEditing({ ...draft, name: event.target.value })} />
                  ) : (
                    <span className="font-medium">{member.name}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {editing?.id === member.id ? (
                    <select
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
                      value={draft.roleType}
                      onChange={(event) => setEditing({ ...draft, roleType: event.target.value as "FULL_TIME" | "INTERN" })}
                    >
                      <option value="FULL_TIME">Full time</option>
                      <option value="INTERN">Intern</option>
                    </select>
                  ) : member.roleType === "FULL_TIME" ? (
                    "Full time"
                  ) : (
                    "Intern"
                  )}
                </td>
                <td className="px-3 py-3">
                  {member.roleType === "FULL_TIME" ? settings.workingHoursFullTime : settings.workingHoursIntern}h
                </td>
                <td className="px-3 py-3">
                  <Badge tone={member.active ? "success" : "neutral"}>{member.active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    {editing?.id === member.id ? (
                      <>
                        <Button disabled={isPending} type="button" onClick={() => save(draft)}>
                          Save
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" variant="secondary" onClick={() => setEditing(member)}>
                          Edit
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => toggleActive(member)}>
                          {member.active ? "Deactivate" : "Activate"}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
