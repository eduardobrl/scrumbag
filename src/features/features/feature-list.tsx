"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  FINISHED: "Finished"
};

export function FeatureList({ features }: { features: FeatureListItem[] }) {
  const router = useRouter();
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
        No features for this release yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[780px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Feature</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Lifecycle</th>
            <th className="px-3 py-2">SP</th>
            <th className="px-3 py-2">Days</th>
            <th className="px-3 py-2">Progress</th>
            <th className="px-3 py-2">Period</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white">
          {features.map((feature) => (
            <tr key={feature.id}>
              <td className="px-3 py-3">
                <div className="font-medium">{feature.name}</div>
                <div className="text-xs text-slate-500">{feature.description || "No description"}</div>
              </td>
              <td className="px-3 py-3">
                <Badge tone={feature.summary.calculatedStatus === "FINISHED" ? "success" : "neutral"}>
                  {STATUS_LABEL[feature.summary.calculatedStatus] ?? feature.summary.calculatedStatus}
                </Badge>
              </td>
              <td className="px-3 py-3">
                <Badge tone={feature.lifecycleStatus === "CANCELLED" ? "danger" : "success"}>
                  {feature.lifecycleStatus === "CANCELLED" ? "Cancelled" : "Active"}
                </Badge>
              </td>
              <td className="px-3 py-3">{feature.summary.totalStoryPoints}</td>
              <td className="px-3 py-3">{feature.summary.totalEstimatedDays}d</td>
              <td className="px-3 py-3">{feature.summary.progressPercentage}%</td>
              <td className="px-3 py-3">{feature.summary.periodLabel}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" className="h-8 w-8 p-0" asChild>
                    <Link href={`/features/${feature.id}`}>
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">View</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" className="h-8 w-8 p-0" asChild>
                    <Link href={`/features/${feature.id}/edit`}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    disabled={isPending || feature.lifecycleStatus === "CANCELLED"}
                    onClick={() => cancelFeature(feature.id)}
                  >
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Cancel feature</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
