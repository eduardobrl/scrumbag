import { ReleaseDetail } from "@/features/releases/release-detail";
import { getReleaseDetails, toReleaseView } from "@/lib/releases";
import { getSprintPlanningSummary } from "@/lib/sprint-planning-summary";
import { notFound } from "next/navigation";

export default async function ReleaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const release = await getReleaseDetails(id);

  if (!release) {
    notFound();
  }

  const view = toReleaseView(release);
  const sprints = await Promise.all(
    view.sprints.map(async (sprint) => ({
      ...sprint,
      plannedEffortDays: (await getSprintPlanningSummary(sprint.id)).plannedEffortDays
    }))
  );

  return <ReleaseDetail release={{ ...view, sprints }} />;
}
