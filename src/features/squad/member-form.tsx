"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MemberForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roleType, setRoleType] = useState<"FULL_TIME" | "INTERN">("FULL_TIME");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/squad-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, roleType, active })
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.errors?.name ?? "Unable to save member");
      return;
    }

    setName("");
    setRoleType("FULL_TIME");
    setActive(true);
    startTransition(() => router.refresh());
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Member name
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ana" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Schedule
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          value={roleType}
          onChange={(event) => setRoleType(event.target.value as "FULL_TIME" | "INTERN")}
        >
          <option value="FULL_TIME">Full time</option>
          <option value="INTERN">Intern</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
        Active
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button disabled={isPending} type="submit">
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Add member
      </Button>
    </form>
  );
}
