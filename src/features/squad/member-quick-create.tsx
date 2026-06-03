"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MemberQuickCreate() {
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

    if (!response.ok) {
      const payload = await response.json();
      setError(payload.errors?.name ?? "Unable to save squad member");
      return;
    }

    setName("");
    setRoleType("FULL_TIME");
    setActive(true);
    startTransition(() => router.refresh());
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="member-name">
          Member name
        </label>
        <Input id="member-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ana" />
      </div>
      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">Schedule</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["FULL_TIME", "Full time"],
            ["INTERN", "Intern"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`h-10 rounded-md border text-sm font-medium ${
                roleType === value ? "border-accent bg-teal-50 text-accent" : "border-slate-300 bg-white text-slate-700"
              }`}
              onClick={() => setRoleType(value as "FULL_TIME" | "INTERN")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
        Active
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button disabled={isPending} type="submit">
        <Save className="h-4 w-4" aria-hidden="true" />
        Save member
      </Button>
    </form>
  );
}
