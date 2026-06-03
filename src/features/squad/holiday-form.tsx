"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HolidayForm() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, name })
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(Object.values(payload.errors ?? {}).join(", ") || "Unable to save holiday");
      return;
    }

    setDate("");
    setName("");
    startTransition(() => router.refresh());
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Date
        <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Name
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Local holiday" />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button disabled={isPending} type="submit">
        <CalendarPlus className="h-4 w-4" aria-hidden="true" />
        Add holiday
      </Button>
    </form>
  );
}
