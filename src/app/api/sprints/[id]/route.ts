import { NextResponse } from "next/server";
import { getSprintDetails, updateSprint } from "@/lib/sprints";
import { getSprintPlanningSummary, recalculateSprintPlanningSummary } from "@/lib/sprint-planning-summary";
import { toSprintView } from "@/lib/sprints";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sprint = await getSprintDetails(id);

  if (!sprint) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  const summary = getSprintPlanningSummary(id);

  return NextResponse.json({
    sprint: {
      ...toSprintView(sprint),
      releaseName: sprint.release.name,
      releaseId: sprint.releaseId
    },
    summary
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await request.json();

  const result = await updateSprint(id, payload);

  if (!result.ok) {
    return NextResponse.json(
      { errors: result.errors, warnings: result.warnings },
      { status: 400 }
    );
  }

  // Trigger recalculation hook for affected sprint planning summary
  recalculateSprintPlanningSummary(id);

  const summary = getSprintPlanningSummary(id);

  return NextResponse.json({
    sprint: {
      ...toSprintView(result.data!),
      releaseName: result.data!.release.name,
      releaseId: result.data!.releaseId
    },
    summary,
    warnings: result.warnings
  });
}
