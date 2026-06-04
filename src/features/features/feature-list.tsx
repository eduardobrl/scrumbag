"use client";

import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { Eye, Pencil, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

export type FeatureListItem = {
  id: string;
  name: string;
  description: string;
  lifecycleStatus: string;
  summary: {
    calculatedStatus: string;
    totalStoryPoints: number;
    totalEstimatedDays: number;
    progressPercentage: number;
    periodLabel: string;
  };
};

export function FeatureList({ features }: { features: FeatureListItem[] }) {
  const router = useRouter();
  const t = useTranslations("features");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const [isPending, startTransition] = useTransition();

  async function cancelFeature(id: string) {
    const response = await fetch(`/api/features/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" })
    });

    if (response.ok) {
      startTransition(() => router.refresh());
    }
  }

  if (features.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-white p-6 text-center text-sm text-slate-600">
        {t("noFeatures")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[780px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">{t("feature")}</th>
            <th className="px-3 py-2">{t("status")}</th>
            <th className="px-3 py-2">{t("lifecycle")}</th>
            <th className="px-3 py-2">{t("sp")}</th>
            <th className="px-3 py-2">{t("days")}</th>
            <th className="px-3 py-2">{t("progress")}</th>
            <th className="px-3 py-2">{t("period")}</th>
            <th className="px-3 py-2">{t("actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white">
          {features.map((feature) => (
            <tr key={feature.id}>
              <td className="px-3 py-3">
                <div className="font-medium">{feature.name}</div>
                <div className="text-xs text-slate-500">{feature.description || t("noDescription")}</div>
              </td>
              <td className="px-3 py-3">
                <Badge tone={feature.summary.calculatedStatus === "FINISHED" ? "success" : "neutral"}>
                  {tStatus(feature.summary.calculatedStatus)}
                </Badge>
              </td>
              <td className="px-3 py-3">
                <Badge tone={feature.lifecycleStatus === "CANCELLED" ? "danger" : "success"}>
                  {feature.lifecycleStatus === "CANCELLED" ? t("cancelled") : t("active")}
                </Badge>
              </td>
              <td className="px-3 py-3">{feature.summary.totalStoryPoints}</td>
              <td className="px-3 py-3">{feature.summary.totalEstimatedDays}d</td>
              <td className="px-3 py-3">{feature.summary.progressPercentage}%</td>
              <td className="px-3 py-3">{feature.summary.periodLabel}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1">
                  <IconButton label={tCommon("view")} href={`/features/${feature.id}`}>
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                  <IconButton label={tCommon("edit")} href={`/features/${feature.id}/edit`}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    label={t("cancel")}
                    disabled={isPending || feature.lifecycleStatus === "CANCELLED"}
                    onClick={() => cancelFeature(feature.id)}
                  >
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
