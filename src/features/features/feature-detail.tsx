import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StoryList, type StoryListItem } from "@/features/stories/story-list";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

type FeatureDetailProps = {
  feature: {
    id: string;
    name: string;
    description: string;
    releaseName: string | null;
    lifecycleStatus: string;
    summary: {
      calculatedStatus: string;
      totalStoryPoints: number;
      totalEstimatedDays: number;
      progressPercentage: number;
      periodLabel: string;
      storyCount: number;
    };
  };
  stories: StoryListItem[];
};

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Não iniciada",
  IN_PROGRESS: "Em andamento",
  FINISHED: "Finalizada"
};

export async function FeatureDetail({ feature, stories }: FeatureDetailProps) {
  const tFeatures = await getTranslations("features");
  const tStories = await getTranslations("stories");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/features">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Features
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-ink">{feature.name}</h1>
            <p className="text-sm text-slate-500">{feature.releaseName ?? tFeatures("noRelease")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <Link href={`/features/${feature.id}/edit`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {tStories("edit")}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/features/${feature.id}/stories/new`}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {tStories("new")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
          <div className="mt-1">
            <Badge tone={feature.summary.calculatedStatus === "FINISHED" ? "success" : "neutral"}>
              {STATUS_LABEL[feature.summary.calculatedStatus] ?? feature.summary.calculatedStatus}
            </Badge>
          </div>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{tFeatures("lifecycle")}</p>
          <div className="mt-1">
            <Badge tone={feature.lifecycleStatus === "CANCELLED" ? "danger" : "success"}>
              {feature.lifecycleStatus === "CANCELLED" ? "Cancelada" : "Ativa"}
            </Badge>
          </div>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Story Points</p>
          <p className="mt-1 text-lg font-semibold">{feature.summary.totalStoryPoints}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Dias estimados</p>
          <p className="mt-1 text-lg font-semibold">{feature.summary.totalEstimatedDays}d</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Progresso</p>
          <p className="mt-1 text-lg font-semibold">{feature.summary.progressPercentage}%</p>
        </Card>
      </div>

      {feature.description && (
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Descrição</p>
          <p className="mt-1 text-sm text-slate-700">{feature.description}</p>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Histórias ({feature.summary.storyCount})
        </h2>
        <StoryList stories={stories} />
      </section>
    </div>
  );
}
