"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

type ReleaseOption = {
  id: string;
  name: string;
};

type FeatureFormProps = {
  releases: ReleaseOption[];
  initial?: {
    id: string;
    releaseId: string | null;
    name: string;
    description: string;
  };
  selectedReleaseId?: string;
};

export function FeatureForm({ releases, initial, selectedReleaseId }: FeatureFormProps) {
  const router = useRouter();
  const tFeatures = useTranslations("features");
  const tCommon = useTranslations("common");
  const [releaseId, setReleaseId] = useState(initial?.releaseId ?? selectedReleaseId ?? releases[0]?.id ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const response = await fetch(initial ? `/api/features/${initial.id}` : "/api/features", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ releaseId: releaseId || null, name, description })
    });
    const payload = await response.json();

    if (!response.ok) {
      setErrors(payload.errors ?? {});
      return;
    }

    startTransition(() => {
      router.push(initial ? `/features/${initial.id}` : `/features?releaseId=${releaseId || "orphans"}`);
      router.refresh();
      if (!initial) {
        setName("");
        setDescription("");
      }
    });
  }

  return (
    <form className="space-y-4 rounded-lg border border-line bg-white p-4" onSubmit={onSubmit}>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Release
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          value={releaseId}
          onChange={(event) => setReleaseId(event.target.value)}
        >
          <option value="">{tFeatures("noRelease")}</option>
          {releases.map((release) => (
            <option key={release.id} value={release.id}>
              {release.name}
            </option>
          ))}
        </select>
        {errors.releaseId && <p className="text-xs text-red-600">{errors.releaseId}</p>}
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Nome
        <Input value={name} onChange={(event) => setName(event.target.value)} required />
        {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Descrição
        <textarea
          className="min-h-[96px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      {errors.general && <p className="text-sm text-red-700">{errors.general}</p>}

      <div className="flex gap-2">
        <Button disabled={isPending} type="submit">
          <Save className="h-4 w-4" aria-hidden="true" />
          {initial ? tCommon("saveChanges") : tFeatures("new")}
        </Button>
        {initial && (
          <Button type="button" variant="secondary" onClick={() => router.push(`/features/${initial.id}`)}>
            <X className="h-4 w-4" aria-hidden="true" />
            {tCommon("cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
