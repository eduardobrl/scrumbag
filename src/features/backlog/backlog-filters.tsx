"use client";

import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

type ReleaseOption = { id: string; name: string };
type FeatureOption = { id: string; name: string };

export function BacklogFilters({
  releases,
  features,
  selectedReleaseId
}: {
  releases: ReleaseOption[];
  features: FeatureOption[];
  selectedReleaseId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  function update(key: string, value: string | boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "" || value === false) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    if (key === "releaseId") {
      params.delete("featureId");
    }
    startTransition(() => router.push(`/backlog?${params.toString()}`));
  }

  return (
    <div className="grid gap-3 rounded-lg border border-line bg-white p-4 lg:grid-cols-6">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Release
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          value={selectedReleaseId}
          onChange={(event) => update("releaseId", event.target.value)}
        >
          {releases.map((release) => (
            <option key={release.id} value={release.id}>
              {release.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Feature
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          value={searchParams.get("featureId") ?? ""}
          onChange={(event) => update("featureId", event.target.value)}
        >
          <option value="">Todas</option>
          {features.map((feature) => (
            <option key={feature.id} value={feature.id}>
              {feature.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Status
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          value={searchParams.get("status") ?? "ALL"}
          onChange={(event) => update("status", event.target.value === "ALL" ? "" : event.target.value)}
        >
          <option value="ALL">Todos</option>
          <option value="BACKLOG">Backlog</option>
          <option value="SPRINT_BACKLOG">Backlog da Sprint</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="DONE">Concluída</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700 lg:col-span-2">
        Busca
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          onBlur={() => update("q", q)}
          onKeyDown={(event) => {
            if (event.key === "Enter") update("q", q);
          }}
          placeholder="Título, descrição, critérios de aceite"
        />
      </label>
      <div className="flex flex-col justify-end gap-2 text-sm text-slate-700">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={searchParams.get("unplannedOnly") !== "false"}
            onChange={(event) => update("unplannedOnly", event.target.checked ? "" : "false")}
          />
          Não planejadas
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={searchParams.get("includeCanceled") === "true"}
            onChange={(event) => update("includeCanceled", event.target.checked ? "true" : "")}
          />
          Incluir canceladas
        </label>
      </div>
    </div>
  );
}
