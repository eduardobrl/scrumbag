"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Member = {
  id: string;
  name: string;
};

export function AbsenceForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [type, setType] = useState<"VACATION" | "DAY_OFF">("VACATION");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!memberId && members[0]?.id) {
      setMemberId(members[0].id);
    }
  }, [memberId, members]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/absences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, type, startDate, endDate, notes })
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(Object.values(payload.errors ?? {}).join(", ") || "Unable to save absence");
      return;
    }

    setStartDate("");
    setEndDate("");
    setNotes("");
    startTransition(() => router.refresh());
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Member
        <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={memberId} onChange={(event) => setMemberId(event.target.value)}>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Type
        <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={type} onChange={(event) => setType(event.target.value as "VACATION" | "DAY_OFF")}>
          <option value="VACATION">Vacation</option>
          <option value="DAY_OFF">Day off</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Start date
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          End date
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Notes
        <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional" />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button disabled={isPending || members.length === 0} type="submit">
        <CalendarPlus className="h-4 w-4" aria-hidden="true" />
        Add absence
      </Button>
    </form>
  );
}
