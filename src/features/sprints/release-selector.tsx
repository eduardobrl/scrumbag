"use client";

import { useRouter } from "next/navigation";

export function ReleaseSelector({
  releases,
  selectedId
}: {
  releases: { id: string; name: string }[];
  selectedId: string;
}) {
  const router = useRouter();

  if (releases.length <= 1) {
    return null;
  }

  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      Release
      <select
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
        value={selectedId}
        onChange={(event) => {
          router.push(`/sprints?releaseId=${event.target.value}`);
        }}
      >
        {releases.map((release) => (
          <option key={release.id} value={release.id}>
            {release.name}
          </option>
        ))}
      </select>
    </label>
  );
}
