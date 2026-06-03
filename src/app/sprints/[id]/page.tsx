import { notFound } from "next/navigation";
import { getSprintDetails } from "@/lib/sprints";
import { getSprintPlanningSummary } from "@/lib/sprint-planning-summary";
import { SprintDetail } from "@/features/sprints/sprint-detail";

export default async function SprintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sprint = await getSprintDetails(id);

  if (!sprint) {
    notFound();
  }

  const summary = getSprintPlanningSummary(id);

  return (
    <SprintDetail
      sprint={{
        id: sprint.id,
        name: sprint.name,
        goal: sprint.goal ?? "",
        startDate: sprint.startDate.toISOString().slice(0, 10),
        endDate: sprint.endDate.toISOString().slice(0, 10),
        status: sprint.status,
        releaseName: sprint.release.name,
        releaseId: sprint.releaseId
      }}
      summary={summary}
    />
  );
}
