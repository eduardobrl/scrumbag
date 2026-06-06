"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";

export function ResolveImpedimentForm({ impedimentId, defaultResolutionDate }: { impedimentId: string; defaultResolutionDate: string }) {
  const router = useRouter();
  const [resolutionDate, setResolutionDate] = useState(defaultResolutionDate);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const response = await fetch(`/api/impediments/${impedimentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve", resolutionDate, resolutionNotes })
    });
    const payload = await response.json();

    if (!response.ok) {
      setErrors(payload.errors ?? {});
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form className="space-y-3 rounded-lg border border-line bg-white p-4" onSubmit={onSubmit}>
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
        <h2 className="text-sm font-semibold uppercase text-slate-500">Resolver impedimento</h2>
      </div>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Data de resolucao
        <Input type="date" value={resolutionDate} onChange={(event) => setResolutionDate(event.target.value)} required />
        {errors.resolutionDate && <p className="text-xs text-red-600">{errors.resolutionDate}</p>}
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Notas da resolucao
        <textarea
          className="min-h-[80px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
          value={resolutionNotes}
          onChange={(event) => setResolutionNotes(event.target.value)}
        />
      </label>

      {errors.status && <p className="text-sm text-red-700">{errors.status}</p>}
      {errors.general && <p className="text-sm text-red-700">{errors.general}</p>}

      <Button disabled={isPending} type="submit">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Resolver
      </Button>
    </form>
  );
}
