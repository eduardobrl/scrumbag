"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { RELEASE_STATUS_VALUES } from "@/lib/release-status";

type ReleaseEditFormProps = {
  id: string;
  initial: {
    name: string;
    objective: string;
    description: string;
    startDate: string;
    endDate: string;
    defaultSprintLengthBusinessDays: number;
    meetingPercentage: number;
    supportPercentage: number;
    status: string;
  };
};

export function ReleaseEditForm({ id, initial }: ReleaseEditFormProps) {
  const router = useRouter();
  const tRelease = useTranslations("release");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const [name, setName] = useState(initial.name);
  const [objective, setObjective] = useState(initial.objective);
  const [description, setDescription] = useState(initial.description);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [defaultSprintLength, setDefaultSprintLength] = useState(String(initial.defaultSprintLengthBusinessDays));
  const [meetingPercentage, setMeetingPercentage] = useState(String(initial.meetingPercentage));
  const [supportPercentage, setSupportPercentage] = useState(String(initial.supportPercentage));
  const [status, setStatus] = useState(initial.status);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setName(initial.name);
    setObjective(initial.objective);
    setDescription(initial.description);
    setStartDate(initial.startDate);
    setEndDate(initial.endDate);
    setDefaultSprintLength(String(initial.defaultSprintLengthBusinessDays));
    setMeetingPercentage(String(initial.meetingPercentage));
    setSupportPercentage(String(initial.supportPercentage));
    setStatus(initial.status);
  }, [initial]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const response = await fetch(`/api/releases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        objective,
        description,
        startDate,
        endDate,
        defaultSprintLengthBusinessDays: Number(defaultSprintLength),
        meetingPercentage: Number(meetingPercentage),
        supportPercentage: Number(supportPercentage),
        status
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setErrors(payload.errors ?? {});
      return;
    }

    startTransition(() => {
      router.push(`/releases/${id}`);
      router.refresh();
    });
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              {tRelease("name")}
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Release Q3 2026"
                required
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              {tCommon("status")}
              <select
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {RELEASE_STATUS_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {tStatus(value)}
                  </option>
                ))}
              </select>
              {errors.status && <p className="text-xs text-red-600">{errors.status}</p>}
            </label>
          </div>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            {tRelease("objective")}
            <Input
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              placeholder="Entregar melhorias do fluxo de onboarding"
              required
            />
            {errors.objective && <p className="text-xs text-red-600">{errors.objective}</p>}
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            {tRelease("description")}
            <textarea
              className="min-h-[80px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-teal-100"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={tRelease("description")}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              {tRelease("startDate")}
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
              {errors.startDate && <p className="text-xs text-red-600">{errors.startDate}</p>}
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              {tRelease("endDate")}
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
              />
              {errors.endDate && <p className="text-xs text-red-600">{errors.endDate}</p>}
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              {tRelease("defaultSprintLengthBusinessDays")}
              <Input
                type="number"
                min={1}
                value={defaultSprintLength}
                onChange={(event) => setDefaultSprintLength(event.target.value)}
                required
              />
              {errors.defaultSprintLengthBusinessDays && (
                <p className="text-xs text-red-600">{errors.defaultSprintLengthBusinessDays}</p>
              )}
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              {tRelease("meetingPercentage")}
              <Input
                type="number"
                min={0}
                max={100}
                value={meetingPercentage}
                onChange={(event) => setMeetingPercentage(event.target.value)}
                required
              />
              {errors.meetingPercentage && <p className="text-xs text-red-600">{errors.meetingPercentage}</p>}
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              {tRelease("supportPercentage")}
              <Input
                type="number"
                min={0}
                max={100}
                value={supportPercentage}
                onChange={(event) => setSupportPercentage(event.target.value)}
                required
              />
              {errors.supportPercentage && <p className="text-xs text-red-600">{errors.supportPercentage}</p>}
            </label>
          </div>

          {errors.general && <p className="text-sm text-red-700">{errors.general}</p>}
        </div>

        <div className="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
          <Button disabled={isPending} type="submit" className="w-full">
            <Save className="h-4 w-4" aria-hidden="true" />
            {tCommon("saveChanges")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => router.push(`/releases/${id}`)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            {tCommon("cancel")}
          </Button>
        </div>
      </div>
    </form>
  );
}
