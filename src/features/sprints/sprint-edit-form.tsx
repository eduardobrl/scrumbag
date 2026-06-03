"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "PLANNED", label: "Planned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "CLOSED", label: "Closed" }
];

type SprintEditFormProps = {
  id: string;
  initial: {
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
    status: string;
  };
};

export function SprintEditForm({ id, initial }: SprintEditFormProps) {
  const router = useRouter();
  const [goal, setGoal] = useState(initial.goal);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [status, setStatus] = useState(initial.status);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setWarnings([]);

    const response = await fetch(`/api/sprints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal,
        startDate,
        endDate,
        status
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setErrors(payload.errors ?? {});
      return;
    }

    if (payload.warnings && Array.isArray(payload.warnings)) {
      const warningMessages = payload.warnings
        .map((w: { message?: string }) => w.message)
        .filter(Boolean) as string[];
      setWarnings(warningMessages);
    }

    startTransition(() => {
      router.push(`/sprints/${id}`);
      router.refresh();
    });
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Name
              <Input value={initial.name} disabled />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Status
              <select
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.status && <p className="text-xs text-red-600">{errors.status}</p>}
            </label>
          </div>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Goal
            <Input
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="Sprint goal or objective"
            />
            {errors.goal && <p className="text-xs text-red-600">{errors.goal}</p>}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Start date
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
              {errors.startDate && <p className="text-xs text-red-600">{errors.startDate}</p>}
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              End date
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
              />
              {errors.endDate && <p className="text-xs text-red-600">{errors.endDate}</p>}
            </label>
          </div>

          {errors.dates && <p className="text-sm text-red-700">{errors.dates}</p>}
          {errors.general && <p className="text-sm text-red-700">{errors.general}</p>}

          {warnings.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-medium">Schedule warnings:</p>
              <ul className="mt-1 list-disc pl-4">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
          <Button disabled={isPending} type="submit" className="w-full">
            <Save className="h-4 w-4" aria-hidden="true" />
            Save changes
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => router.push(`/sprints/${id}`)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
