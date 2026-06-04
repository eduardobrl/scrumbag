"use client";

import { Bot, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

type ReleaseOption = {
  id: string;
  name: string;
  status: string;
  capacityLabel: string | null;
  overCapacity: boolean;
};

export function ReleaseSwitcher({
  releases,
  defaultReleaseId
}: {
  releases: ReleaseOption[];
  defaultReleaseId: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tHeader = useTranslations("header");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const releaseId = searchParams.get("releaseId") ?? defaultReleaseId;
  const selected = useMemo(
    () => releases.find((release) => release.id === releaseId) ?? releases.find((release) => release.id === defaultReleaseId),
    [defaultReleaseId, releaseId, releases]
  );

  function updateRelease(nextReleaseId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("releaseId", nextReleaseId);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-sm font-medium text-slate-500">{tHeader("activeRelease")}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        {selected ? (
          <>
            <select
              aria-label={tHeader("allReleases")}
              value={selected.id}
              onChange={(event) => updateRelease(event.target.value)}
              className="max-w-72 rounded-md border border-transparent bg-transparent px-1 py-1 text-sm font-semibold text-ink hover:border-slate-300 focus:border-accent focus:outline-none"
            >
              {releases.map((release) => (
                <option key={release.id} value={release.id}>
                  {release.name}
                </option>
              ))}
            </select>
            <Badge tone={selected.status === "IN_PROGRESS" ? "success" : "neutral"}>
              {tStatus(selected.status)}
            </Badge>
            <Badge tone={selected.overCapacity ? "danger" : "success"}>
              {selected.capacityLabel ?? `${tHeader("capacity")}: --`}
            </Badge>
          </>
        ) : (
          <>
            <span className="font-semibold">{tHeader("noRelease")}</span>
            <Badge>{tCommon("notConfigured")}</Badge>
            <Badge tone="warning">{tHeader("capacity")}: --</Badge>
          </>
        )}
      </div>
      <Link
        href={releaseId ? `/assistant?releaseId=${encodeURIComponent(releaseId)}` : "/assistant"}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
      >
        <Bot className="h-4 w-4" aria-hidden="true" />
        {tCommon("assistant")}
      </Link>
    </div>
  );
}
