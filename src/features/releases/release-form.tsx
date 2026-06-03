"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_OPTIONS = [
  { value: "PLANNED", label: "Planned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" }
];

export function ReleaseForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [defaultSprintLength, setDefaultSprintLength] = useState("10");
  const [meetingPercentage, setMeetingPercentage] = useState("10");
  const [supportPercentage, setSupportPercentage] = useState("20");
  const [status, setStatus] = useState("PLANNED");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/releases", {
      method: "POST",
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
      const firstError = Object.values(payload.errors ?? {})[0];
      setError(typeof firstError === "string" ? firstError : "Unable to save release");
      return;
    }

    // Reset form
    setName("");
    setObjective("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setDefaultSprintLength("10");
    setMeetingPercentage("10");
    setSupportPercentage("20");
    setStatus("PLANNED");
    startTransition(() => router.refresh());
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Name
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Release Q3 2026"
            required
          />
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
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Objective
        <Input
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
          placeholder="Deliver onboarding improvements"
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Description
        <textarea
          className="min-h-[60px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-teal-100"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional details"
        />
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
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          End date
          <Input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            required
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Sprint length (business days)
          <Input
            type="number"
            min={1}
            value={defaultSprintLength}
            onChange={(event) => setDefaultSprintLength(event.target.value)}
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Meeting %
          <Input
            type="number"
            min={0}
            max={100}
            value={meetingPercentage}
            onChange={(event) => setMeetingPercentage(event.target.value)}
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Support %
          <Input
            type="number"
            min={0}
            max={100}
            value={supportPercentage}
            onChange={(event) => setSupportPercentage(event.target.value)}
            required
          />
        </label>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <Button disabled={isPending} type="submit">
        <CalendarPlus className="h-4 w-4" aria-hidden="true" />
        Save and generate sprints
      </Button>
    </form>
  );
}
