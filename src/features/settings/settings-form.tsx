"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SettingsView = {
  workingHoursFullTime: number;
  workingHoursIntern: number;
  standardDayHours: number;
  mcpHost: string;
  mcpPort: number;
  mcpEnabled: boolean;
};

type Errors = Partial<Record<keyof SettingsView, string>>;

export function SettingsForm({ initialSettings }: { initialSettings: SettingsView }) {
  const [values, setValues] = useState(initialSettings);
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof SettingsView>(field: K, value: SettingsView[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaved(false);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setErrors({});

    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    const payload = await response.json();

    if (!response.ok) {
      setErrors(payload.errors ?? {});
      setSaving(false);
      return;
    }

    setValues(payload.settings);
    setSaved(true);
    setSaving(false);
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <Card className="grid gap-4">
        <h2 className="text-base font-semibold">Capacity</h2>
        <div className="grid grid-cols-3 gap-4">
          <NumberField
            label="Full-time hours"
            value={values.workingHoursFullTime}
            error={errors.workingHoursFullTime}
            onChange={(value) => update("workingHoursFullTime", value)}
          />
          <NumberField
            label="Intern hours"
            value={values.workingHoursIntern}
            error={errors.workingHoursIntern}
            onChange={(value) => update("workingHoursIntern", value)}
          />
          <NumberField
            label="Standard day hours"
            value={values.standardDayHours}
            error={errors.standardDayHours}
            onChange={(value) => update("standardDayHours", value)}
          />
        </div>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-base font-semibold">Local database</h2>
        <div className="rounded-md border border-line bg-slate-50 px-3 py-2 text-sm text-slate-700">./data/squad-planner.db</div>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-base font-semibold">MCP</h2>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={values.mcpEnabled} onChange={(event) => update("mcpEnabled", event.target.checked)} />
          Enable local MCP server
        </label>
        <div className="grid grid-cols-[1fr_180px] gap-4">
          <TextField label="MCP host" value={values.mcpHost} error={errors.mcpHost} onChange={(value) => update("mcpHost", value)} />
          <NumberField label="MCP port" value={values.mcpPort} error={errors.mcpPort} onChange={(value) => update("mcpPort", value)} />
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button disabled={saving} type="submit">
          <Save className="h-4 w-4" aria-hidden="true" />
          Save settings
        </Button>
        {saved ? <p className="text-sm font-medium text-emerald-700">Settings saved</p> : null}
      </div>
    </form>
  );
}

function NumberField({
  label,
  value,
  error,
  onChange
}: {
  label: string;
  value: number;
  error?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <Input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
      {error ? <span className="text-xs font-normal text-red-700">{error}</span> : null}
    </label>
  );
}

function TextField({
  label,
  value,
  error,
  onChange
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
      {error ? <span className="text-xs font-normal text-red-700">{error}</span> : null}
    </label>
  );
}
